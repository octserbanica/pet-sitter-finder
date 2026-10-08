-- Pet Sitter Finder: profiles, richer pets, per-service prices, chat and photos.
-- Run once in Supabase > SQL Editor, after 001_initial.sql.

-- ---------------------------------------------------------------------------
-- Profiles: one account can both look for sitters and be a sitter.
-- ---------------------------------------------------------------------------

alter table public.profiles alter column role drop not null; -- no longer used; kept so old app versions keep working
alter table public.profiles
  add column age int check (age between 18 and 120),
  add column about text not null default '' check (length(about) <= 1000),
  add column avatar_url text;

-- Name, age, photo and "about me" are visible to other signed-in users.
drop policy "Read own profile" on public.profiles;
create policy "Signed-in users read profiles" on public.profiles for select to authenticated using (true);
create policy "Users update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Sitter listings: price per service, extra-pet surcharge, photo from the profile.
-- ---------------------------------------------------------------------------

alter table public.sitters drop constraint if exists sitters_price_check;
alter table public.sitters
  add column prices jsonb not null default '{}',
  add column extra_pet_percent int not null default 30 check (extra_pet_percent between 0 and 100),
  add column photo_url text;

-- prices is the source of truth: {"boarding": 120, "walking": 50}. services is kept in sync for filtering,
-- and price holds the lowest price for sorting.
create function public.sync_sitter_services() returns trigger
language plpgsql as $$
declare k text; v jsonb;
begin
  for k, v in select * from jsonb_each(new.prices) loop
    if k not in ('boarding', 'house', 'dropin', 'walking') then raise exception 'Unknown service %', k; end if;
    if jsonb_typeof(v) <> 'number' or (v #>> '{}')::numeric not between 5 and 2000
       or (v #>> '{}')::numeric <> trunc((v #>> '{}')::numeric) then
      raise exception 'Price for % must be a whole number between 5 and 2000', k;
    end if;
  end loop;
  new.services := array(select jsonb_object_keys(new.prices) order by 1);
  new.price := coalesce((select min((value #>> '{}')::int) from jsonb_each(new.prices)), new.price);
  return new;
end $$;

create trigger sitter_services_sync before insert or update on public.sitters
  for each row execute function public.sync_sitter_services();

-- Existing listings: nightly services keep their price; visits and walks start at a lower rate.
update public.sitters set prices = coalesce(
  (select jsonb_object_agg(s, case s when 'walking' then round(price * 0.4) when 'dropin' then round(price * 0.5) else price end)
   from unnest(services) s),
  '{}');

-- Any signed-in user can create one sitter listing for themselves ("Become a sitter").
create function public.before_sitter_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare p profiles%rowtype;
begin
  if auth.uid() is null then return new; end if; -- seeding from the SQL editor
  select * into p from profiles where id = auth.uid();
  new.user_id := auth.uid();
  new.name := coalesce(nullif(p.full_name, ''), 'New sitter');
  new.photo_url := p.avatar_url;
  new.rating := 0; new.reviews := 0; new.review_list := '[]'; new.verified := false;
  return new;
end $$;

create trigger sitter_insert before insert on public.sitters
  for each row execute function public.before_sitter_insert();

create policy "Users create own sitter listing" on public.sitters for insert to authenticated
  with check (user_id = auth.uid());

-- Name and photo on a listing always follow the owner's profile.
create or replace function public.before_sitter_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.user_id := old.user_id;
  new.rating := old.rating;
  new.reviews := old.reviews;
  new.review_list := old.review_list;
  new.verified := old.verified;
  if new.user_id is not null then
    select coalesce(nullif(full_name, ''), new.name), avatar_url into new.name, new.photo_url from profiles where id = new.user_id;
  end if;
  return new;
end $$;

create function public.after_profile_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update sitters set name = name where user_id = new.id; -- before_sitter_update copies the new name and photo
  return new;
end $$;

create trigger profile_update after update on public.profiles
  for each row execute function public.after_profile_update();

-- ---------------------------------------------------------------------------
-- Pets: size, temperament and photo. Sitters can see the pets in bookings sent to them.
-- ---------------------------------------------------------------------------

alter table public.pets
  add column size text check (size in ('small', 'medium', 'large', 'giant')),
  add column temperament text[] not null default '{}',
  add column photo_url text;

alter table public.bookings add column pet_ids uuid[] not null default '{}';

create policy "Sitters see pets in their bookings" on public.pets for select to authenticated
  using (exists (
    select 1 from public.bookings b join public.sitters s on s.id = b.sitter_id
    where s.user_id = auth.uid() and pets.id = any (b.pet_ids)
  ));

-- ---------------------------------------------------------------------------
-- Bookings: anyone signed in can book (not themselves); price uses per-service prices.
-- ---------------------------------------------------------------------------

drop policy "Owners create bookings" on public.bookings;
create policy "Signed-in users create bookings" on public.bookings for insert to authenticated
  with check (owner_id = auth.uid());

create or replace function public.before_booking_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  s sitters%rowtype;
  base numeric;
  pet_count int;
begin
  select * into s from sitters where id = new.sitter_id;
  if not found then raise exception 'Sitter not found'; end if;
  if s.user_id = auth.uid() then raise exception 'You cannot book yourself'; end if;
  if not s.available then raise exception 'This sitter is not taking bookings right now'; end if;
  base := (s.prices ->> new.service)::numeric;
  if base is null then raise exception 'This sitter does not offer that service'; end if;

  -- Pet details come from the owner's saved pets, not from the app.
  -- (Older app versions send only names in pets and no pet_ids; that still works.)
  if cardinality(new.pet_ids) > 0 then
    select coalesce(jsonb_agg(jsonb_build_object('name', p.name, 'type', p.type) order by p.created_at), '[]'),
           coalesce(array_agg(p.id order by p.created_at), '{}')
      into new.pets, new.pet_ids
      from pets p where p.id = any (new.pet_ids) and p.owner_id = auth.uid();
  end if;
  pet_count := jsonb_array_length(new.pets);
  if pet_count = 0 then raise exception 'Choose at least one pet'; end if;

  new.owner_id := auth.uid();
  select full_name into new.owner_name from profiles where id = auth.uid();
  new.total := round(base * (1 + s.extra_pet_percent / 100.0 * (pet_count - 1))) * new.nights;
  new.status := case when s.user_id is null then 'accepted' else 'pending' end;
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Chat: one conversation per owner and sitter listing.
-- ---------------------------------------------------------------------------

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  sitter_id uuid not null references public.sitters on delete cascade,
  sender_id uuid not null default auth.uid() references auth.users on delete cascade,
  body text not null check (length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index on public.messages (owner_id, sitter_id, created_at);
create index on public.messages (sitter_id, created_at);

alter table public.messages enable row level security;

create policy "Participants read messages" on public.messages for select to authenticated
  using (owner_id = auth.uid() or sitter_id in (select id from public.sitters where user_id = auth.uid()));

create policy "Participants send messages" on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.sitters s
      where s.id = sitter_id and s.user_id is not null and s.user_id <> owner_id
        and (owner_id = auth.uid() or s.user_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Photos: public bucket; each user can only write inside their own folder ({user id}/...).
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public) values ('photos', 'photos', true) on conflict (id) do nothing;

create policy "Users upload own photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users read own photo files" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete own photos" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
