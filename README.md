# Timepiece

Production-oriented Next.js marketplace for verified luxury watches with Pons v2 markets on Robinhood Chain.

## What is implemented

- Next.js 15 App Router + TypeScript, ready for Vercel.
- WebGL watch experience with vanilla Three.js WebGL / Three.js + GSAP scroll choreography.
- Custom EIP-1193 / EIP-6963 wallet connection layer. No RainbowKit, Wagmi, Coinbase CDP, WalletConnect, or x402 dependency chain.
- Robinhood Chain switching/add-network flow (chain id `4663`).
- Luxury-watch marketplace with the top 10 brand filters.
- Real watch listing submission, Supabase Storage uploads, possession-code verification and wallet-signature verification.
- Admin verification queue with protected server APIs.
- Pons v2 launch-draft generation using live launch fee, live enabled config, pinned launch economics and `canLaunch()`.
- Admin wallet can submit the Pons launch; after confirmation the app decodes `TokenLaunched` and automatically saves token + curve addresses and launch block.
- Real Pons curve buy flow from the connected wallet with a live curve quote and 3% minimum-output protection.
- Live token page data from Pons + Robinhood Chain Blockscout.
- Real curve-trade indexing cron for `CurveBuy` / `CurveSell`; no mock chart data.
- Supabase-backed trade history, holder/price snapshots and OHLC candles.

## Important current limitation

Pons v2 decides whether a wallet may launch via `canLaunch(address)` inside the protocol. If Pons' public gate is closed, a non-approved wallet cannot be bypassed by Timepiece.

After a token graduates from its Pons bonding curve, Pons routes trading to Uniswap v4. Timepiece detects that phase and stops offering the curve buy button. A v4 swap router should be integrated before enabling pool-phase trading in production.

## Setup

### 1. Install

```bash
npm install
```

### 2. Configure Supabase

Create a Supabase project. Run the complete SQL file:

```text
supabase/schema.sql
```

Then configure `.env.local` using `.env.example`.

Required for full database functionality:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TIMEPIECE_ADMIN_KEY=
```

See `README_DATABASE.md` for the complete database handoff documentation.

### 3. Robinhood Chain + Pons

Defaults are already configured for Robinhood Chain:

```env
NEXT_PUBLIC_ROBINHOOD_RPC_URL=https://rpc.mainnet.chain.robinhood.com
NEXT_PUBLIC_PONS_FACTORY_ADDRESS=0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e
```

`PONS_DEFAULT_LAUNCH_CONFIG_ID` may be left blank. The backend enumerates the live Pons launch configs and selects an enabled config at launch time rather than blindly assuming config `0` is still enabled.

### 4. Keep real transactions off while setting up

```env
NEXT_PUBLIC_ENABLE_MAINNET_ACTIONS=false
```

This lets the admin generate and verify a real Pons launch draft without broadcasting a launch. Set it to `true` only after Supabase, your admin key, wallet and Pons access are verified.

### 5. Market-data cron

Set:

```env
CRON_SECRET=<long random secret>
```

`vercel.json` calls `/api/cron/market-sync` every 30 minutes. The route indexes real Pons curve events in bounded block ranges, stores trades, and writes token snapshots. Repeated runs continue from `market_synced_block`.

### 6. Deploy

Push the directory to GitHub and import it into Vercel, or run:

```bash
vercel
```

Add all environment variables to the Vercel project before production deployment.

## Wallet support

The project intentionally uses the browser's standard EVM wallet provider rather than a heavy wallet UI SDK. It discovers modern wallets through EIP-6963 and falls back to `window.ethereum`.

Desktop: MetaMask, Rabby, Coinbase Wallet extension, and compatible EVM wallets.

Mobile: open Timepiece in the wallet's built-in browser.

This removed the dependency chain that caused the prior Vercel build to pull Coinbase CDP/x402 modules that were not installed.

## Build verification

Run before deploy:

```bash
npm run typecheck
npm run build
```

The previous `experimental.typedRoutes` setting was removed, so the Next.js 15 warning is gone. ESLint is not installed as a production build dependency; add your preferred lint stack separately if wanted.

## Key routes

- `/` — animated landing page
- `/watches` — marketplace
- `/watches/[slug]` — watch + live token market
- `/list` — owner listing/verification flow
- `/admin` — admin queue (server actions still require `TIMEPIECE_ADMIN_KEY`)
- `/api/pons/status` — live Pons factory/config/launch eligibility status
- `/api/pons/token/[address]` — live Pons + Robinhood market data
- `/api/cron/market-sync` — Pons curve event indexer

## Security notes before public launch

- Use a strong `TIMEPIECE_ADMIN_KEY` and never expose `SUPABASE_SERVICE_ROLE_KEY` client-side.
- Keep `NEXT_PUBLIC_ENABLE_MAINNET_ACTIONS=false` until launch testing is complete.
- Add rate limiting / bot protection to upload and submission APIs before significant public traffic.
- Ownership-possession photos prove control of the pictured watch, not authenticity. Only mark `authenticated` after your actual authentication process.
- The economic/legal relationship between a physical watch and its token needs a real custody/ownership agreement; the Pons token by itself does not create that legal claim.
