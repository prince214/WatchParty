-- ============================================================
-- Movie Watch Party — Initial Schema
-- ============================================================

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Anyone can view profiles"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'username',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Movies
create table public.movies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  google_drive_file_id text not null,
  thumbnail_url text,
  added_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.movies enable row level security;

create policy "Authenticated users can view movies"
  on public.movies for select
  to authenticated
  using (true);

create policy "Users can insert movies"
  on public.movies for insert
  to authenticated
  with check (auth.uid() = added_by);

create policy "Owners can update movies"
  on public.movies for update
  to authenticated
  using (auth.uid() = added_by);

create policy "Owners can delete movies"
  on public.movies for delete
  to authenticated
  using (auth.uid() = added_by);

-- Rooms
create table public.rooms (
  id text primary key,
  name text not null,
  host_id uuid references public.profiles(id) not null,
  movie_id uuid references public.movies(id),
  is_chat_muted boolean default false,
  playback_state jsonb default '{"playing": false, "timestamp": 0}'::jsonb,
  created_at timestamptz default now()
);

alter table public.rooms enable row level security;

create policy "Anyone can view rooms"
  on public.rooms for select
  to authenticated
  using (true);

create policy "Authenticated users can create rooms"
  on public.rooms for insert
  to authenticated
  with check (auth.uid() = host_id);

create policy "Host can update room"
  on public.rooms for update
  to authenticated
  using (auth.uid() = host_id);

create policy "Host can delete room"
  on public.rooms for delete
  to authenticated
  using (auth.uid() = host_id);

-- Messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id text references public.rooms(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Participants can view messages"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.room_participants rp
      where rp.room_id = messages.room_id
        and rp.user_id = auth.uid()
    )
  );

create policy "Participants can send messages"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.room_participants rp
      where rp.room_id = messages.room_id
        and rp.user_id = auth.uid()
    )
  );

create policy "Host can delete messages"
  on public.messages for delete
  to authenticated
  using (
    exists (
      select 1 from public.rooms r
      where r.id = messages.room_id
        and r.host_id = auth.uid()
    )
  );

-- Room participants
create table public.room_participants (
  id uuid primary key default gen_random_uuid(),
  room_id text references public.rooms(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  joined_at timestamptz default now(),
  unique(room_id, user_id)
);

alter table public.room_participants enable row level security;

create policy "Anyone can view participants"
  on public.room_participants for select
  to authenticated
  using (true);

create policy "Users can join rooms"
  on public.room_participants for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can leave rooms"
  on public.room_participants for delete
  to authenticated
  using (auth.uid() = user_id);

-- Enable realtime for messages table
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.rooms;

-- Indexes
create index idx_messages_room_id on public.messages(room_id, created_at);
create index idx_room_participants_room_id on public.room_participants(room_id);
create index idx_room_participants_user_id on public.room_participants(user_id);
create index idx_rooms_host_id on public.rooms(host_id);
