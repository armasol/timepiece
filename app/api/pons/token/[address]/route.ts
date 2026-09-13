import { NextResponse } from 'next/server';
import { formatUnits, isAddress, type Address } from 'viem';
import { erc20Abi, getCurveSpotPriceEth, getPonsLaunch, publicClient } from '@/lib/pons';
import { getSupabaseAdmin, hasSupabaseEnv } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

type TradeRow = { block_time: string; price_eth: number | string; };

function candlesFromTrades(rows: TradeRow[], bucketMs = 60 * 60 * 1000) {
  const buckets = new Map<number, { time:number; open:number; high:number; low:number; close:number }>();
  for (const row of rows) {
    const price = Number(row.price_eth);
    const ts = new Date(row.block_time).getTime();
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(ts)) continue;
    const bucket = Math.floor(ts / bucketMs) * bucketMs;
    const existing = buckets.get(bucket);
    if (!existing) buckets.set(bucket, { time: Math.floor(bucket / 1000), open: price, high: price, low: price, close: price });
    else { existing.high = Math.max(existing.high, price); existing.low = Math.min(existing.low, price); existing.close = price; }
  }
  return [...buckets.values()].sort((a,b) => a.time - b.time);
}

async function blockscoutToken(address: string) {
  const response = await fetch(`https://robinhoodchain.blockscout.com/api/v2/tokens/${address}`, { next: { revalidate: 30 } });
  if (!response.ok) return null;
  return response.json();
}

async function blockscoutStats() {
  const response = await fetch('https://robinhoodchain.blockscout.com/api/v2/stats', { next: { revalidate: 60 } });
  if (!response.ok) return null;
  return response.json();
}

export async function GET(_: Request, { params }: { params: Promise<{ address: string }> }) {
  try {
    const { address: raw } = await params;
    if (!isAddress(raw)) return NextResponse.json({ error: 'Invalid token address' }, { status: 400 });
    const address = raw as Address;
    const [launch, tokenMeta, chainStats, name, symbol, decimals, totalSupply] = await Promise.all([
      getPonsLaunch(address),
      blockscoutToken(address).catch(() => null),
      blockscoutStats().catch(() => null),
      publicClient.readContract({ address, abi: erc20Abi, functionName: 'name' }).catch(() => ''),
      publicClient.readContract({ address, abi: erc20Abi, functionName: 'symbol' }).catch(() => ''),
      publicClient.readContract({ address, abi: erc20Abi, functionName: 'decimals' }).catch(() => 18),
      publicClient.readContract({ address, abi: erc20Abi, functionName: 'totalSupply' }).catch(() => 0n)
    ]);
    if (!launch) return NextResponse.json({ error: 'This address is not a token from the configured Pons v2 factory.' }, { status: 404 });

    let priceEth: number | null = null;
    if (launch.phase === 0 && isAddress(launch.curve)) priceEth = await getCurveSpotPriceEth(launch.curve as Address).catch(() => null);

    let trades: TradeRow[] = [];
    let latestSnapshot: any = null;
    if (hasSupabaseEnv) {
      const supabase = getSupabaseAdmin();
      const [{ data: tradeRows }, { data: snapshot }] = await Promise.all([
        supabase.from('market_trades').select('block_time,price_eth').eq('token_address', address.toLowerCase()).order('block_time', { ascending: true }).limit(5000),
        supabase.from('token_snapshots').select('*').eq('token_address', address.toLowerCase()).order('created_at', { ascending: false }).limit(1).maybeSingle()
      ]);
      trades = (tradeRows || []) as TradeRow[];
      latestSnapshot = snapshot;
      if (priceEth == null && tradeRows?.length) priceEth = Number(tradeRows[tradeRows.length - 1].price_eth);
    }

    const ethUsd = Number(chainStats?.coin_price || 0) || null;
    const tokenSupply = Number(formatUnits(totalSupply, Number(decimals)));
    const priceUsd = priceEth != null && ethUsd != null ? priceEth * ethUsd : (latestSnapshot?.price_usd != null ? Number(latestSnapshot.price_usd) : null);
    const marketCapUsd = priceUsd != null && Number.isFinite(tokenSupply) ? priceUsd * tokenSupply : (latestSnapshot?.market_cap_usd != null ? Number(latestSnapshot.market_cap_usd) : null);
    const candles = candlesFromTrades(trades);

    return NextResponse.json({ market: {
      tokenAddress: address,
      name: name || tokenMeta?.name || undefined,
      symbol: symbol || tokenMeta?.symbol || undefined,
      holders: Number(tokenMeta?.holders_count ?? latestSnapshot?.holder_count ?? 0),
      marketCapUsd,
      priceUsd,
      priceEth,
      volume24hUsd: latestSnapshot?.volume_24h_usd != null ? Number(latestSnapshot.volume_24h_usd) : null,
      curveAddress: launch.curve,
      phase: launch.phaseLabel,
      phaseCode: launch.phase,
      creatorTaxBps: launch.creatorTaxBps,
      buybackEnabled: launch.buybackEnabled,
      candles
    }});
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Market data unavailable' }, { status: 500 });
  }
}
