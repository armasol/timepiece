-- Timepiece Supabase schema
-- Run this in Supabase SQL Editor before deploying.

create extension if not exists pgcrypto;

create type verification_status as enum ('draft','submitted','owner_verified','authenticated','rejected');
create type watch_condition as enum ('Unworn','Excellent','Very Good','Good','Fair');

create table if not exists public.watches (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  brand text not null,
  model text not null,
  reference_number text,
  year integer,
  condition watch_condition not null default 'Excellent',
  appraised_value_usd numeric(14,2) not null,
  tokenized_percent numeric(5,2) not null check (tokenized_percent > 0 and tokenized_percent <= 100),
  verification_status verification_status not null default 'submitted',
  owner_wallet text not null check (owner_wallet ~ '^0x[a-fA-F0-9]{40}$'),
  primary_image_url text,
  verification_image_url text,
  verification_code text,
  pons_token_address text check (pons_token_address is null or pons_token_address ~ '^0x[a-fA-F0-9]{40}$'),
  pons_curve_address text check (pons_curve_address is null or pons_curve_address ~ '^0x[a-fA-F0-9]{40}$'),
  description text,
  box_papers boolean not null default false,
  serial_verified boolean not null default false,
  published boolean not null default false,
  signature text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.watch_images (
  id uuid primary key default gen_random_uuid(),
  watch_id uuid references public.watches(id) on delete cascade,
  image_url text not null,
  image_type text not null check (image_type in ('front','back','side','clasp','serial','box_papers','appraisal','verification','other')),
  created_at timestamptz not null default now()
);

create table if not exists public.token_snapshots (
  id uuid primary key default gen_random_uuid(),
  watch_id uuid references public.watches(id) on delete cascade,
  token_address text not null,
  holder_count integer,
  market_cap_usd numeric(18,4),
  price_usd numeric(18,10),
  volume_24h_usd numeric(18,4),
  source text not null default 'blockscout',
  created_at timestamptz not null default now()
);

create table if not exists public.reward_cycles (
  id uuid primary key default gen_random_uuid(),
  watch_id uuid references public.watches(id) on delete cascade,
  token_address text not null,
  cycle_start timestamptz not null,
  cycle_end timestamptz not null,
  quote_asset text not null default 'ETH',
  amount_wei numeric(78,0) not null default 0,
  merkle_root text,
  status text not null default 'calculated' check (status in ('calculated','funded','claimable','closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_events (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  watch_id uuid references public.watches(id) on delete set null,
  payload jsonb,
  created_at timestamptz not null default now()
);

alter table public.watches enable row level security;
alter table public.watch_images enable row level security;
alter table public.token_snapshots enable row level security;
alter table public.reward_cycles enable row level security;
alter table public.admin_events enable row level security;

-- Public users can read published watches only.
create policy "public read published watches" on public.watches for select using (published = true);
create policy "public insert submitted watches" on public.watches for insert with check (verification_status = 'submitted' and published = false);
create policy "public read watch images" on public.watch_images for select using (true);
create policy "public read token snapshots" on public.token_snapshots for select using (true);
create policy "public read reward cycles" on public.reward_cycles for select using (true);

-- Server-side service role bypasses RLS. Admin APIs use SUPABASE_SERVICE_ROLE_KEY.

insert into storage.buckets (id, name, public) values ('watch-images','watch-images',true) on conflict (id) do nothing;

create policy "public upload watch images" on storage.objects for insert with check (bucket_id = 'watch-images');
create policy "public read watch images bucket" on storage.objects for select using (bucket_id = 'watch-images');
