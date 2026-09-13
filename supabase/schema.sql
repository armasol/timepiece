-- Timepiece production schema for Supabase Postgres + Storage.
-- Safe to re-run. Apply this entire file in Supabase SQL Editor.

create extension if not exists pgcrypto;

do $$ begin
  create type verification_status as enum ('draft','submitted','owner_verified','authenticated','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type watch_condition as enum ('Unworn','Excellent','Very Good','Good','Fair');
exception when duplicate_object then null; end $$;

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
  pons_launch_tx_hash text,
  pons_launch_block bigint,
  market_synced_block bigint,
  description text,
  box_papers boolean not null default false,
  serial_verified boolean not null default false,
  published boolean not null default false,
  signature text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migration helpers for databases created from an earlier Timepiece schema.
alter table public.watches add column if not exists pons_launch_tx_hash text;
alter table public.watches add column if not exists pons_launch_block bigint;
alter table public.watches add column if not exists market_synced_block bigint;

create table if not exists public.verification_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  watch_id uuid references public.watches(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.watch_images (
  id uuid primary key default gen_random_uuid(),
  watch_id uuid references public.watches(id) on delete cascade,
  image_url text not null,
  image_type text not null check (image_type in ('front','back','side','clasp','serial','box_papers','appraisal','verification','other')),
  created_at timestamptz not null default now()
);

create table if not exists public.market_trades (
  id uuid primary key default gen_random_uuid(),
  watch_id uuid references public.watches(id) on delete cascade,
  token_address text not null,
  curve_address text not null,
  side text not null check (side in ('buy','sell')),
  tx_hash text not null,
  log_index integer not null,
  block_number bigint not null,
  block_time timestamptz not null,
  quote_wei numeric(78,0) not null,
  token_amount_wei numeric(78,0) not null,
  fee_wei numeric(78,0) not null default 0,
  tax_wei numeric(78,0) not null default 0,
  price_eth numeric(38,20) not null,
  created_at timestamptz not null default now(),
  unique (token_address, tx_hash, log_index)
);

create table if not exists public.token_snapshots (
  id uuid primary key default gen_random_uuid(),
  watch_id uuid references public.watches(id) on delete cascade,
  token_address text not null,
  holder_count integer,
  market_cap_usd numeric(24,4),
  price_usd numeric(24,12),
  price_eth numeric(38,20),
  volume_24h_usd numeric(24,4),
  phase text,
  source text not null default 'robinhood+pons',
  created_at timestamptz not null default now()
);
alter table public.token_snapshots add column if not exists price_eth numeric(38,20);
alter table public.token_snapshots add column if not exists phase text;

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

create index if not exists watches_published_idx on public.watches(published, created_at desc);
create index if not exists watches_token_idx on public.watches(pons_token_address);
create index if not exists market_trades_token_time_idx on public.market_trades(token_address, block_time asc);
create index if not exists token_snapshots_watch_time_idx on public.token_snapshots(watch_id, created_at desc);
create index if not exists verification_codes_code_idx on public.verification_codes(code);

alter table public.watches enable row level security;
alter table public.verification_codes enable row level security;
alter table public.watch_images enable row level security;
alter table public.market_trades enable row level security;
alter table public.token_snapshots enable row level security;
alter table public.reward_cycles enable row level security;
alter table public.admin_events enable row level security;

drop policy if exists "public read published watches" on public.watches;
create policy "public read published watches" on public.watches for select using (published = true);

drop policy if exists "public read watch images" on public.watch_images;
create policy "public read watch images" on public.watch_images for select using (true);

drop policy if exists "public read market trades" on public.market_trades;
create policy "public read market trades" on public.market_trades for select using (true);

drop policy if exists "public read token snapshots" on public.token_snapshots;
create policy "public read token snapshots" on public.token_snapshots for select using (true);

drop policy if exists "public read reward cycles" on public.reward_cycles;
create policy "public read reward cycles" on public.reward_cycles for select using (true);

-- Verification codes and admin events intentionally have no public policies.
-- Server routes use the service role key and bypass RLS.

insert into storage.buckets (id, name, public)
values ('watch-images','watch-images',true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "public read watch images bucket" on storage.objects;
create policy "public read watch images bucket" on storage.objects for select using (bucket_id = 'watch-images');
