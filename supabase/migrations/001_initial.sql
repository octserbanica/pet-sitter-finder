-- Pet Sitter Finder database.
-- Paste this whole file into Supabase > SQL Editor and press Run. Safe to run once on a new project.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null default '',
  role text not null check (role in ('owner', 'sitter')),
  created_at timestamptz not null default now()
);

-- Public sitter listings. Demo sitters have no user_id; real sitters are linked to their account.
create table public.sitters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users on delete cascade,
  name text not null,
  avatar text not null default '🙂',
  city text not null default '',
  neighborhood text not null default '',
  rating numeric(2,1) not null default 0,
  reviews int not null default 0,
  price int not null default 100 check (price between 20 and 500),
  years int not null default 0,
  verified boolean not null default false,
  available boolean not null default false,
  services text[] not null default '{}',
  accepts text[] not null default '{}',
  bio text not null default '',
  review_list jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  type text not null check (type in ('dog', 'cat', 'bird', 'small')),
  breed text not null default '',
  age int not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  owner_name text not null default '',
  sitter_id uuid not null references public.sitters on delete cascade,
  pets jsonb not null default '[]',
  service text not null check (service in ('boarding', 'house', 'dropin', 'walking')),
  start date not null,
  nights int not null check (nights between 1 and 60),
  note text not null default '',
  total int not null check (total >= 0),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now()
);

create table public.favorites (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  sitter_id uuid not null references public.sitters on delete cascade,
  primary key (user_id, sitter_id)
);

create index on public.pets (owner_id);
create index on public.bookings (owner_id);
create index on public.bookings (sitter_id);

-- ---------------------------------------------------------------------------
-- New accounts: create a profile, and a (hidden until edited) listing for sitters.
-- The app passes full_name and role as sign-up metadata.
-- ---------------------------------------------------------------------------

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_role text := coalesce(new.raw_user_meta_data->>'role', 'owner');
  v_name text := coalesce(new.raw_user_meta_data->>'full_name', '');
begin
  if v_role not in ('owner', 'sitter') then v_role := 'owner'; end if;
  insert into public.profiles (id, full_name, role) values (new.id, v_name, v_role);
  if v_role = 'sitter' then
    insert into public.sitters (user_id, name, services, accepts)
    values (new.id, v_name, '{dropin}', '{dog,cat}');
  end if;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Booking rules enforced by the database.
-- ---------------------------------------------------------------------------

-- New bookings always start as pending; demo sitters (no account) accept instantly.
-- The owner's name and the price are set here rather than trusted from the app.
-- Pricing: walks are half the base rate; each extra pet adds 30% (same rule as src/pricing.ts).
create function public.before_booking_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  s sitters%rowtype;
  base numeric;
begin
  select * into s from sitters where id = new.sitter_id;
  if not found then raise exception 'Sitter not found'; end if;
  if not s.available then raise exception 'This sitter is not taking bookings right now'; end if;
  if not (new.service = any (s.services)) then raise exception 'This sitter does not offer that service'; end if;
  if jsonb_array_length(new.pets) = 0 then raise exception 'Choose at least one pet'; end if;

  new.owner_id := auth.uid();
  select full_name into new.owner_name from profiles where id = auth.uid();
  base := case when new.service = 'walking' then round(s.price * 0.5) else s.price end;
  new.total := round(base * (1 + 0.3 * (jsonb_array_length(new.pets) - 1))) * new.nights;
  new.status := case when s.user_id is null then 'accepted' else 'pending' end;
  return new;
end $$;

create trigger booking_insert before insert on public.bookings
  for each row execute function public.before_booking_insert();

-- Only the status can change after a booking is made, and only along allowed paths:
-- the owner may cancel; the sitter may accept or decline a pending request, or cancel an accepted one.
create function public.before_booking_update() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  is_owner boolean := old.owner_id = auth.uid();
  is_sitter boolean := exists (select 1 from sitters where id = old.sitter_id and user_id = auth.uid());
begin
  if (to_jsonb(new) - 'status') is distinct from (to_jsonb(old) - 'status') then
    raise exception 'Only the booking status can be changed';
  end if;
  if new.status = old.status then return new; end if;
  if is_owner and new.status = 'cancelled' and old.status in ('pending', 'accepted') then return new; end if;
  if is_sitter and old.status = 'pending' and new.status in ('accepted', 'declined') then return new; end if;
  if is_sitter and old.status = 'accepted' and new.status = 'cancelled' then return new; end if;
  raise exception 'Cannot change booking from % to %', old.status, new.status;
end $$;

create trigger booking_update before update on public.bookings
  for each row execute function public.before_booking_update();

-- Sitters cannot edit their own rating, reviews or verification.
create function public.before_sitter_update() returns trigger
language plpgsql as $$
begin
  new.user_id := old.user_id;
  new.rating := old.rating;
  new.reviews := old.reviews;
  new.review_list := old.review_list;
  new.verified := old.verified;
  return new;
end $$;

create trigger sitter_update before update on public.sitters
  for each row execute function public.before_sitter_update();

-- ---------------------------------------------------------------------------
-- Row level security: who can see and change which rows.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.sitters enable row level security;
alter table public.pets enable row level security;
alter table public.bookings enable row level security;
alter table public.favorites enable row level security;

create policy "Read own profile" on public.profiles for select to authenticated using (id = auth.uid());

create policy "Signed-in users browse sitters" on public.sitters for select to authenticated using (true);
create policy "Sitters edit own listing" on public.sitters for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Owners manage own pets" on public.pets for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Owners and sitters see their bookings" on public.bookings for select to authenticated
  using (owner_id = auth.uid() or sitter_id in (select id from public.sitters where user_id = auth.uid()));
create policy "Owners create bookings" on public.bookings for insert to authenticated
  with check (owner_id = auth.uid() and exists (select 1 from public.profiles where id = auth.uid() and role = 'owner'));
create policy "Owners and sitters update their bookings" on public.bookings for update to authenticated
  using (owner_id = auth.uid() or sitter_id in (select id from public.sitters where user_id = auth.uid()));

create policy "Users manage own favorites" on public.favorites for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Demo sitters so the app is not empty on day one. Delete them whenever you like.
-- ---------------------------------------------------------------------------

insert into public.sitters (name, avatar, city, neighborhood, rating, reviews, price, years, verified, available, services, accepts, bio, review_list) values
('Maria Ionescu', '👩🏻', 'Bucharest', 'Floreasca', 4.9, 128, 120, 6, true, true, '{boarding,house,dropin}', '{dog,cat,small}',
 'Vet nurse by day and lifelong animal lover. I have a fenced garden and a calm senior beagle who loves company.',
 '[{"author":"Andrei","stars":5,"text":"Sent photos every evening. Our cat did not even notice we were gone."},{"author":"Elena","stars":5,"text":"Handled our dog''s medication perfectly."}]'),
('Radu Popescu', '🧔🏻', 'Bucharest', 'Herăstrău', 4.8, 74, 60, 4, true, true, '{walking,dropin}', '{dog}',
 'Marathon runner, so your energetic dog will get the long walks they deserve. Park is two minutes away.',
 '[{"author":"Ioana","stars":5,"text":"Our husky finally comes home tired!"}]'),
('Sofia Marin', '👩🏽', 'Cluj-Napoca', 'Grigorescu', 5.0, 41, 100, 3, true, true, '{house,dropin}', '{cat,bird,small}',
 'Quiet home, no other pets. Experienced with shy cats, parrots and rabbits.',
 '[{"author":"Mihai","stars":5,"text":"Our parrot learned a new word while we were away."}]'),
('Vlad Georgescu', '👨🏼', 'Bucharest', 'Drumul Taberei', 4.6, 22, 90, 2, false, true, '{boarding,walking}', '{dog,cat}',
 'Student working from home with plenty of time for play. Big apartment and lots of toys.',
 '[{"author":"Cristina","stars":4,"text":"Friendly and reliable, would book again."}]'),
('Ana Dumitru', '👩🏼‍🦰', 'Timișoara', 'Complex Studențesc', 4.9, 96, 110, 8, true, false, '{boarding,house,dropin,walking}', '{dog,cat,bird,small}',
 'Certified pet first aid. I treat every guest like family and keep a daily diary for you.',
 '[{"author":"Bogdan","stars":5,"text":"Best sitter we have ever had."}]'),
('Tudor Stan', '👨🏽', 'Cluj-Napoca', 'Mărăști', 4.7, 35, 80, 5, true, true, '{boarding,walking}', '{dog}',
 'Former dog trainer. Good with reactive dogs and puppies still learning the basics.',
 '[{"author":"Raluca","stars":5,"text":"He even helped with our puppy''s leash pulling."}]');
