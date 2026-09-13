# Timepiece — Supabase / Database Handoff

This file is written so a future developer or AI can connect, migrate, debug, or extend the Timepiece database without reverse-engineering the app.

## Source of truth

Run:

```text
supabase/schema.sql
```

The schema is idempotent and includes migration-safe `add column if not exists` statements for earlier Timepiece databases.

## Required environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key; SERVER ONLY>
TIMEPIECE_ADMIN_KEY=<long random admin secret>
```

The current API implementation performs writes with the Supabase service-role client from Vercel route handlers. The service-role key must never be prefixed with `NEXT_PUBLIC_`.

## Tables

### `watches`
The canonical marketplace record.

Important fields:

- `id` — UUID primary key
- `slug` — public watch URL identifier
- `brand`, `model`, `reference_number`, `year`, `condition`
- `appraised_value_usd`
- `tokenized_percent`
- `owner_wallet`
- `verification_code`
- `primary_image_url`, `verification_image_url`
- `verification_status` — `draft | submitted | owner_verified | authenticated | rejected`
- `published`
- `pons_token_address`
- `pons_curve_address`
- `pons_launch_tx_hash`
- `pons_launch_block`
- `market_synced_block` — last Robinhood block processed by the market indexer

### `verification_codes`
Server-generated one-time possession codes.

A listing code expires after 30 minutes. On successful submission the API sets `consumed_at` and attaches `watch_id`.

### `watch_images`
Optional normalized image records for future multi-image galleries. The current form stores the main URLs directly on `watches`, while files live in the `watch-images` Storage bucket.

### `market_trades`
Trust-minimized pre-graduation Pons curve trades indexed from Robinhood Chain.

Each row is unique by:

```text
(token_address, tx_hash, log_index)
```

Fields include side, block/time, raw quote/token amounts, fee, creator tax and calculated ETH-per-token execution price.

### `token_snapshots`
Periodic market snapshots written by `/api/cron/market-sync`.

Contains:

- holder count
- market cap USD
- token price USD
- token price ETH
- 24h volume USD
- Pons phase

### `reward_cycles`
Reserved for Timepiece's planned 60-minute reward accounting. The schema exists, but a production reward-distribution smart contract / Merkle claim flow is NOT implemented in this package. Do not represent these rewards as active until that system exists.

### `admin_events`
Audit trail for protected admin mutations.

## Storage

Bucket:

```text
watch-images
```

It is public-read so marketplace images can render directly. Uploads happen through `/api/upload` using the service role. The route accepts only JPG, PNG and WebP and caps files at 12 MB.

## RLS model

- Public can read only `watches.published = true`.
- Public can read image metadata, indexed trades, snapshots and reward-cycle records.
- Verification codes and admin events have no public read policy.
- Server route handlers use the service-role key and bypass RLS for controlled writes.

## Listing lifecycle

1. Client calls `POST /api/verification-code`.
2. Server stores a random expiring code in `verification_codes`.
3. Owner uploads watch + code photos through `POST /api/upload`.
4. Owner signs exactly:

```text
Timepiece listing verification
Wallet: <0x wallet>
Code: <TP code>
Watch: <brand> <model> <reference>
```

5. `POST /api/watches` reconstructs that message server-side and verifies the EVM signature with `viem.verifyMessage`.
6. API verifies the code exists, is unused and not expired.
7. Watch is inserted as `submitted`, `published=false`.
8. Admin reviews possession/authentication and changes status through `PATCH /api/admin/watches/[id]`.
9. Admin may publish it and/or launch the Pons market.

## Pons launch lifecycle

`POST /api/pons/launch-draft`:

- validates creator wallet
- reads current Pons `launchFee()`
- enumerates configs and selects an enabled launch config
- reads `previewLaunchEconomics`
- reads `canLaunch(launcher)`
- generates a fresh 32-byte salt
- builds `TokenParams` entirely from the watch listing

No X, Telegram, Discord, or other social metadata is required; those Pons fields are deliberately blank.

On `/admin`, when mainnet actions are enabled, the connected admin wallet calls `launchToken`. After the receipt arrives, the UI decodes Pons `TokenLaunched` and PATCHes the watch with token, curve, transaction hash and launch block automatically.

## Market-data lifecycle

`/api/cron/market-sync` reads published watches with a Pons token + curve.

For each watch it:

1. Resolves the token through Pons `getLaunchedToken`.
2. Continues from `market_synced_block`, or from the saved launch block.
3. Reads real `CurveBuy` and `CurveSell` logs from Robinhood Chain.
4. Fetches block timestamps.
5. Upserts normalized rows into `market_trades`.
6. Reads live curve reserves while phase = `0`.
7. Gets holder/token metadata from Robinhood Chain Blockscout.
8. Writes a `token_snapshots` row.
9. Advances `market_synced_block`.

`GET /api/pons/token/[address]` then combines live Pons state + Blockscout + Supabase trades and returns OHLC candles. The frontend never fabricates chart data.

## Pons phases

The current Pons v2 factory reports:

- `0` — curve trading
- `1` — swept, waiting for pool creation
- `2` — Uniswap v4 pool
- `3` — rescued

The package supports direct trading on phase `0`. It deliberately refuses to pretend curve trading works after graduation. Add the Pons/Uniswap v4 pool router before enabling phase `2` trades from the Timepiece UI.

## API routes for a future AI/dev

```text
GET    /api/watches
POST   /api/watches
GET    /api/watches/[id-or-slug]
POST   /api/upload
POST   /api/verification-code
GET    /api/admin/watches
PATCH  /api/admin/watches/[id]
GET    /api/pons/status?launcher=0x...
POST   /api/pons/launch-draft
GET    /api/pons/token/[address]
GET    /api/cron/market-sync
```

Protected admin routes require:

```http
x-timepiece-admin-key: <TIMEPIECE_ADMIN_KEY>
```

Cron requests require `Authorization: Bearer <CRON_SECRET>` when `CRON_SECRET` is configured.

## If Supabase is not configured

The public marketplace intentionally falls back to a tiny local demo dataset so the design can render. Database submissions, uploads, verification and admin operations return configuration errors instead of silently pretending to save data.
