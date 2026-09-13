# Timepiece

A deployable Next.js / Vercel project for a luxury watch tokenization marketplace on Robinhood Chain / Pons v2.

## Stack

- Next.js App Router
- React + TypeScript
- React Three Fiber / Three.js WebGL watch scenes
- GSAP ScrollTrigger cinematic scrolling
- RainbowKit + Wagmi + Viem wallet connection
- Supabase Postgres + Storage
- Robinhood Chain public RPC
- Pons v2 factory integration helpers
- TradingView Lightweight Charts renderer

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Deploy to Vercel

Import this folder in Vercel, add env vars from `.env.example`, then deploy.

## Supabase

Read `README_DATABASE.md` and run `supabase/schema.sql`.

## What is functional now

- Premium animated landing page with WebGL procedural watch model
- Wallet connect on Robinhood Chain
- Marketplace with top 10 brand filters
- Watch detail pages with token trading panel
- Owner listing flow
- Possession verification code flow
- Supabase-backed listing creation
- Admin dashboard protected by `TIMEPIECE_ADMIN_KEY`
- Admin verify/publish/link Pons contract
- Pons v2 launch-draft generation
- Robinhood Blockscout token lookup endpoint
- Pons curve buy transaction button when a curve address exists

## What still needs production decisions

- Legal/custody model for actual fractional watch ownership
- Professional authentication/appraisal process
- Admin login beyond shared admin key
- Production Pons launch gate approval, if public launches remain restricted
- Rewards contract/indexer for 60-minute redistribution accounting
- Full Uniswap v4 routing after Pons graduation

## Pons notes

Pons v2 uses the factory at `0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e` on Robinhood Chain. Launching uses one `launchToken(TokenParams, launchConfigId, pairToken)` transaction. Token discovery, trading and charts should use onchain reads/events, not a centralized Pons API.

## Dependency/build notes

This package includes RainbowKit explicitly (the previous archive imported it but did not declare it), uses ESLint 9 with Next.js 15, and overrides the deprecated `three-mesh-bvh@0.7.8` line with a modern compatible `0.8.x` release.

Recommended verification before deployment:

```bash
npm install
npm run typecheck
npm run build
```

Some wallet libraries can emit upstream deprecation notices for optional/transitive WalletConnect or MetaMask SDK packages during install. Those notices are not missing dependencies or build failures. Do not force arbitrary transitive versions unless the wallet stack itself is upgraded.
