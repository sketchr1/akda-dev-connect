
create table public.coder_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  location text,
  home_language text,
  headline text,
  fluency text[] not null default '{}',
  hourly_rate_usd numeric(10,2),
  portfolio_urls text[] not null default '{}',
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.coder_profiles enable row level security;

create policy "Coder profiles viewable by everyone"
  on public.coder_profiles for select using (true);

create policy "Users can insert own coder profile"
  on public.coder_profiles for insert
  to authenticated
  with check (auth.uid() = profile_id);

create policy "Users can update own coder profile"
  on public.coder_profiles for update
  to authenticated
  using (auth.uid() = profile_id);
