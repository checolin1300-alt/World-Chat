-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
-- This table stores additional user information linked to auth.users
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique not null,
  avatar_url text,
  bio text,
  theme_color text default 'blue',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles Policies
-- Anyone can read profiles
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

-- Users can insert their own profile
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

-- Users can update their own profile
create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 2. Messages Table
-- This table stores all the chat messages
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on messages
alter table public.messages enable row level security;

-- Messages Policies
-- Anyone can read messages
create policy "Messages are viewable by everyone."
  on messages for select
  using ( true );

-- Authenticated users can insert messages
create policy "Authenticated users can insert messages."
  on messages for insert
  with check ( auth.role() = 'authenticated' and auth.uid() = user_id );

-- 3. Avatars Storage Bucket
-- Create a bucket to store profile pictures
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true);

-- Storage Policies for Avatars
-- Anyone can view avatars
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Authenticated users can upload avatars
create policy "Users can upload their own avatar."
  on storage.objects for insert
  with check ( 
    bucket_id = 'avatars' 
    and auth.role() = 'authenticated'
  );

-- Users can update their own avatar
create policy "Users can update their own avatar."
  on storage.objects for update
  using ( auth.uid() = owner )
  with check ( bucket_id = 'avatars' );

-- 4. Chat Images Storage Bucket
insert into storage.buckets (id, name, public) 
values ('chat-images', 'chat-images', true);

-- Storage Policies for Chat Images
create policy "Chat images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'chat-images' );

create policy "Authenticated users can upload chat images."
  on storage.objects for insert
  with check ( 
    bucket_id = 'chat-images' 
    and auth.role() = 'authenticated'
  );

-- 5. Supabase Realtime Setup
-- Enable replica log on messages for Realtime to work
alter publication supabase_realtime add table messages;
