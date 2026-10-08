-- 004: following people, and remembering which chats have been read.
-- Run once in the Supabase SQL Editor. Safe for the current live site (only adds tables).

-- Who follows whom. Anyone signed in can see follows (like profiles); you can only add or remove your own.
create table public.follows (
  follower_id uuid not null default auth.uid() references auth.users on delete cascade,
  followee_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index on public.follows (followee_id);

alter table public.follows enable row level security;

create policy "Signed-in users see follows" on public.follows for select to authenticated using (true);
create policy "Follow as yourself" on public.follows for insert to authenticated with check (follower_id = auth.uid());
create policy "Unfollow as yourself" on public.follows for delete to authenticated using (follower_id = auth.uid());

-- When each person last opened each conversation, so the app can count unread messages on every device.
create table public.chat_reads (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  owner_id uuid not null references auth.users on delete cascade,
  sitter_id uuid not null references public.sitters on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id, owner_id, sitter_id)
);

alter table public.chat_reads enable row level security;

create policy "Own read markers" on public.chat_reads for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
