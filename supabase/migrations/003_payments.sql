-- Pet Sitter Finder: card payments for accepted bookings (Stripe Checkout).
-- Run once in Supabase > SQL Editor, after 002_profiles_pets_chat.sql.

alter table public.bookings
  add column paid_at timestamptz,
  add column stripe_session_id text;

-- The app can never mark a booking as paid: only the payment functions can, using the server key.
create or replace function public.before_booking_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  s sitters%rowtype;
  base numeric;
  pet_count int;
begin
  new.paid_at := null;
  new.stripe_session_id := null;

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

create or replace function public.before_booking_update() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  is_owner boolean := old.owner_id = auth.uid();
  is_sitter boolean := exists (select 1 from sitters where id = old.sitter_id and user_id = auth.uid());
begin
  -- Server-side code (payment functions, SQL editor) has no signed-in user and may update anything.
  if auth.uid() is null then return new; end if;

  if (to_jsonb(new) - 'status') is distinct from (to_jsonb(old) - 'status') then
    raise exception 'Only the booking status can be changed';
  end if;
  if new.status = old.status then return new; end if;
  if old.paid_at is not null and new.status = 'cancelled' then
    raise exception 'This booking is already paid. Message the other person to arrange a cancellation and refund.';
  end if;
  if is_owner and new.status = 'cancelled' and old.status in ('pending', 'accepted') then return new; end if;
  if is_sitter and old.status = 'pending' and new.status in ('accepted', 'declined') then return new; end if;
  if is_sitter and old.status = 'accepted' and new.status = 'cancelled' then return new; end if;
  raise exception 'Cannot change booking from % to %', old.status, new.status;
end $$;
