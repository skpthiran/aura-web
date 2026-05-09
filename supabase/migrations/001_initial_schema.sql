-- ============================================
-- STEP 1: Enable Extensions
-- ============================================
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- ============================================
-- STEP 2: PROFILES TABLE
-- ============================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  interests text[] default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- ============================================
-- STEP 3: MOMENTS TABLE
-- ============================================
create table public.moments (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  title text not null check (char_length(title) >= 3 and char_length(title) <= 80),
  description text check (char_length(description) <= 500),
  location geography(POINT, 4326) not null,
  capacity_limit int4 not null default 50 check (capacity_limit >= 2 and capacity_limit <= 500),
  expires_at timestamptz not null default (now() + interval '6 hours'),
  is_active boolean default true not null,
  moment_type text not null default 'moment' check (moment_type in ('moment', 'event')),
  tags text[] default '{}',
  created_at timestamptz default now() not null
);

alter table public.moments
  add column if not exists start_time  timestamptz,
  add column if not exists end_time    timestamptz,
  add column if not exists venue       text,
  add column if not exists is_private  boolean default false,
  add column if not exists dresscode   text,
  add column if not exists age_min     int4,
  add column if not exists age_max     int4,
  add column if not exists image_url   text;

create index moments_location_idx on public.moments using gist(location);
create index moments_expires_at_idx on public.moments(expires_at);
create index moments_is_active_idx on public.moments(is_active);

alter table public.moments enable row level security;

create policy "Active moments are viewable by authenticated users"
  on public.moments for select
  to authenticated
  using (is_active = true and expires_at > now());

create policy "Users can create moments"
  on public.moments for insert
  to authenticated
  with check (auth.uid() = creator_id);

create policy "Creators can update their own moments"
  on public.moments for update
  to authenticated
  using (auth.uid() = creator_id);

create policy "Creators can delete their own moments"
  on public.moments for delete
  to authenticated
  using (auth.uid() = creator_id);

-- ============================================
-- STEP 4: PARTICIPANTS TABLE
-- ============================================
create table public.participants (
  id uuid default uuid_generate_v4() primary key,
  moment_id uuid references public.moments(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'joined' check (status in ('joined', 'left')),
  joined_at timestamptz default now() not null,
  unique(moment_id, user_id)
);

create index participants_moment_id_idx on public.participants(moment_id);
create index participants_user_id_idx on public.participants(user_id);

alter table public.participants enable row level security;

create policy "Participants visible to moment members"
  on public.participants for select
  to authenticated
  using (
    user_id = auth.uid() or
    exists (
      select 1 from public.participants p2
      where p2.moment_id = participants.moment_id
      and p2.user_id = auth.uid()
      and p2.status = 'joined'
    )
  );

create policy "Users can join moments"
  on public.participants for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own participation"
  on public.participants for update
  to authenticated
  using (auth.uid() = user_id);

-- ============================================
-- STEP 5: CHAT MESSAGES TABLE
-- ============================================
create table public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  moment_id uuid references public.moments(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null check (char_length(content) >= 1 and char_length(content) <= 1000),
  created_at timestamptz default now() not null
);

create index chat_messages_moment_id_idx on public.chat_messages(moment_id);

alter table public.chat_messages enable row level security;

create policy "Messages visible to moment participants only"
  on public.chat_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.participants p
      where p.moment_id = chat_messages.moment_id
      and p.user_id = auth.uid()
      and p.status = 'joined'
    )
  );

create policy "Participants can send messages"
  on public.chat_messages for insert
  to authenticated
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.participants p
      where p.moment_id = chat_messages.moment_id
      and p.user_id = auth.uid()
      and p.status = 'joined'
    )
  );

-- ============================================
-- STEP 6: CAPACITY ENFORCEMENT FUNCTION
-- ============================================
create or replace function check_moment_capacity()
returns trigger as $$
declare
  current_count int;
  max_capacity int;
begin
  select count(*) into current_count
  from public.participants
  where moment_id = new.moment_id and status = 'joined';

  select capacity_limit into max_capacity
  from public.moments
  where id = new.moment_id;

  if current_count >= max_capacity then
    raise exception 'Moment is at full capacity';
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger enforce_moment_capacity
  before insert on public.participants
  for each row execute function check_moment_capacity();

-- ============================================
-- STEP 7: AUTO-UPDATE updated_at ON PROFILES
-- ============================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function update_updated_at_column();

-- ============================================
-- STEP 8: AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- STEP 9: NEARBY MOMENTS RPC FUNCTION
-- ============================================
create or replace function nearby_moments(
  lat float,
  lng float,
  radius_meters float default 2000
)
returns table (
  id uuid,
  creator_id uuid,
  title text,
  description text,
  capacity_limit int4,
  expires_at timestamptz,
  is_active boolean,
  moment_type text,
  tags text[],
  created_at timestamptz,
  start_time timestamptz,
  end_time timestamptz,
  venue text,
  is_private boolean,
  dresscode text,
  age_min int4,
  age_max int4,
  image_url text,
  distance_meters float,
  participant_count bigint,
  lat float,
  lng float
) as $$
begin
  return query
  select
    m.id,
    m.creator_id,
    m.title,
    m.description,
    m.capacity_limit,
    m.expires_at,
    m.is_active,
    m.moment_type,
    m.tags,
    m.created_at,
    m.start_time,
    m.end_time,
    m.venue,
    m.is_private,
    m.dresscode,
    m.age_min,
    m.age_max,
    m.image_url,
    st_distance(m.location, st_point(lng, lat)::geography) as distance_meters,
    count(p.id) filter (where p.status = 'joined') as participant_count,
    st_y(m.location::geometry) as lat,
    st_x(m.location::geometry) as lng
  from public.moments m
  left join public.participants p on p.moment_id = m.id
  where
    m.is_active = true
    and m.expires_at > now()
    and st_dwithin(m.location, st_point(lng, lat)::geography, radius_meters)
  group by m.id
  order by distance_meters asc;
end;
$$ language plpgsql security definer;

-- ============================================
-- STEP 10: EXPIRE MOMENTS FUNCTION
-- ============================================
create or replace function expire_old_moments()
returns void as $$
begin
  update public.moments
  set is_active = false
  where expires_at < now() and is_active = true;
end;
$$ language plpgsql security definer;
