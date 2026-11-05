create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  highlight_color text not null default '#d77f62',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.day_entries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  entry_date date not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, entry_date)
);

create table public.day_photos (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.day_entries(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), 'My baby diary')
  );
  return new;
end;
$$;

create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();

alter table public.profiles enable row level security;
alter table public.day_entries enable row level security;
alter table public.day_photos enable row level security;

create policy "Users can view their own profiles" on public.profiles
  for select using ((select auth.uid()) = user_id);
create policy "Users can create their own profiles" on public.profiles
  for insert with check ((select auth.uid()) = user_id);
create policy "Users can update their own profiles" on public.profiles
  for update using ((select auth.uid()) = user_id);
create policy "Users can delete their own profiles" on public.profiles
  for delete using ((select auth.uid()) = user_id);

create policy "Users can view their own day entries" on public.day_entries
  for select using (exists (select 1 from public.profiles where profiles.id = day_entries.profile_id and profiles.user_id = (select auth.uid())));
create policy "Users can create their own day entries" on public.day_entries
  for insert with check (exists (select 1 from public.profiles where profiles.id = day_entries.profile_id and profiles.user_id = (select auth.uid())));
create policy "Users can update their own day entries" on public.day_entries
  for update using (exists (select 1 from public.profiles where profiles.id = day_entries.profile_id and profiles.user_id = (select auth.uid())));
create policy "Users can delete their own day entries" on public.day_entries
  for delete using (exists (select 1 from public.profiles where profiles.id = day_entries.profile_id and profiles.user_id = (select auth.uid())));

create policy "Users can view their own day photos" on public.day_photos
  for select using (exists (select 1 from public.day_entries join public.profiles on profiles.id = day_entries.profile_id where day_entries.id = day_photos.entry_id and profiles.user_id = (select auth.uid())));
create policy "Users can create their own day photos" on public.day_photos
  for insert with check (exists (select 1 from public.day_entries join public.profiles on profiles.id = day_entries.profile_id where day_entries.id = day_photos.entry_id and profiles.user_id = (select auth.uid())));
create policy "Users can delete their own day photos" on public.day_photos
  for delete using (exists (select 1 from public.day_entries join public.profiles on profiles.id = day_entries.profile_id where day_entries.id = day_photos.entry_id and profiles.user_id = (select auth.uid())));

insert into storage.buckets (id, name, public)
values ('day-photos', 'day-photos', false)
on conflict (id) do nothing;

create policy "Users can view their own stored photos" on storage.objects
  for select using (bucket_id = 'day-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users can upload their own photos" on storage.objects
  for insert with check (bucket_id = 'day-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users can delete their own stored photos" on storage.objects
  for delete using (bucket_id = 'day-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
