# Timepiece Database README

Use Supabase Postgres + Storage. This app is already wired to Supabase; it only needs your project URL/keys and the SQL schema installed.

## 1. Create Supabase project

Create a Supabase project, then copy:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Add those values to Vercel Environment Variables and `.env.local` for local dev.

## 2. Run schema

Open Supabase → SQL Editor → paste and run:

```text
supabase/schema.sql
```

This creates:

- `watches` — core marketplace listing + Pons token/curve addresses
- `watch_images` — all owner/admin uploaded photos
- `token_snapshots` — cached token holder/price/market data
- `reward_cycles` — hourly reward accounting windows
- `admin_events` — audit trail
- `watch-images` storage bucket

## 3. Minimal production rules

Set these env vars:

```env
TIMEPIECE_ADMIN_KEY=long-random-secret
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
NEXT_PUBLIC_ROBINHOOD_RPC_URL=https://rpc.mainnet.chain.robinhood.com
NEXT_PUBLIC_ENABLE_MAINNET_ACTIONS=false
PONS_FACTORY_ADDRESS=0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e
PONS_DEFAULT_LAUNCH_CONFIG_ID=0
```

`NEXT_PUBLIC_ENABLE_MAINNET_ACTIONS=false` keeps wallet transaction buttons hidden/disabled until you are ready.

## 4. AI handoff notes

The next AI/dev step should connect these routes to real production workflows:

- `POST /api/watches` creates a submitted watch listing.
- `PATCH /api/admin/watches/:id` verifies/publishes/links Pons contracts.
- `GET /api/pons/status` checks current factory fee/config/canLaunch.
- `POST /api/pons/launch-draft` generates exact Pons v2 `TokenParams` for a verified watch.
- `GET /api/pons/token/:address` pulls live token metadata from Robinhood Blockscout.

For real market charts, create an indexer that reads Pons `CurveBuy` and `CurveSell` events before graduation, then Uniswap v4 swaps after graduation. Store OHLC candles in a new `market_candles` table.
