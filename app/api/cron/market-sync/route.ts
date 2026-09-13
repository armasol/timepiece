import { NextResponse } from 'next/server';
import { formatUnits, isAddress, type Address } from 'viem';
import { curveBuyEvent, curveSellEvent, erc20Abi, getCurveSpotPriceEth, getPonsLaunch, publicClient } from '@/lib/pons';
import { getSupabaseAdmin, hasSupabaseEnv } from '@/lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function getEthUsd() {
  try {
    const r = await fetch('https://robinhoodchain.blockscout.com/api/v2/stats');
    if (!r.ok) return null;
    const j = await r.json();
    const value = Number(j.coin_price || 0);
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch { return null; }
}

async function getBlockscoutToken(token: string) {
  try {
    const r = await fetch(`https://robinhoodchain.blockscout.com/api/v2/tokens/${token}`);
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

export async function GET(request: Request){
  const auth = request.headers.get('authorization');
  if(process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({error:'Unauthorized'},{status:401});
  if(!hasSupabaseEnv) return NextResponse.json({error:'Supabase not configured'},{status:503});
  const supabase=getSupabaseAdmin();
  const {data:watches,error}=await supabase.from('watches').select('id,pons_token_address,pons_curve_address,pons_launch_block,market_synced_block').not('pons_token_address','is',null).not('pons_curve_address','is',null).eq('published',true);
  if(error) return NextResponse.json({error:error.message},{status:500});

  const latestBlock = await publicClient.getBlockNumber();
  const ethUsd = await getEthUsd();
  const results:any[] = [];

  for(const w of watches||[]){
    try{
      if (!isAddress(w.pons_token_address) || !isAddress(w.pons_curve_address)) continue;
      const token = w.pons_token_address as Address;
      const curve = w.pons_curve_address as Address;
      const launch = await getPonsLaunch(token);
      if (!launch) { results.push({ id:w.id, error:'Not found in Pons factory' }); continue; }

      const remembered = w.market_synced_block != null ? BigInt(w.market_synced_block) + 1n : null;
      const launchBlock = w.pons_launch_block != null ? BigInt(w.pons_launch_block) : null;
      const fallback = latestBlock > 50_000n ? latestBlock - 50_000n : 0n;
      const fromBlock = remembered ?? launchBlock ?? fallback;
      const toBlock = fromBlock + 15_000n < latestBlock ? fromBlock + 15_000n : latestBlock;

      let insertedTrades = 0;
      if (fromBlock <= toBlock) {
        const [buyLogs, sellLogs] = await Promise.all([
          publicClient.getLogs({ address: curve, event: curveBuyEvent, fromBlock, toBlock }),
          publicClient.getLogs({ address: curve, event: curveSellEvent, fromBlock, toBlock })
        ]);
        const rawLogs = [
          ...buyLogs.map((log:any) => ({ side:'buy' as const, log })),
          ...sellLogs.map((log:any) => ({ side:'sell' as const, log }))
        ].sort((a,b) => Number(a.log.blockNumber - b.log.blockNumber) || Number(a.log.logIndex - b.log.logIndex));

        const blockNumbers = [...new Set(rawLogs.map((x:any) => x.log.blockNumber.toString()))];
        const blockTimes = new Map<string,string>();
        await Promise.all(blockNumbers.map(async (n) => {
          const block = await publicClient.getBlock({ blockNumber: BigInt(n) });
          blockTimes.set(n, new Date(Number(block.timestamp) * 1000).toISOString());
        }));

        const rows = rawLogs.map(({side,log}:any) => {
          const quote = side === 'buy' ? BigInt(log.args.quoteIn || 0) : BigInt(log.args.quoteOut || 0);
          const tokens = side === 'buy' ? BigInt(log.args.tokensOut || 0) : BigInt(log.args.tokensIn || 0);
          const q = Number(formatUnits(quote,18));
          const t = Number(formatUnits(tokens,18));
          return {
            watch_id:w.id,
            token_address:token.toLowerCase(),
            curve_address:curve.toLowerCase(),
            side,
            tx_hash:log.transactionHash,
            log_index:Number(log.logIndex),
            block_number:Number(log.blockNumber),
            block_time:blockTimes.get(log.blockNumber.toString()) || new Date().toISOString(),
            quote_wei:quote.toString(),
            token_amount_wei:tokens.toString(),
            fee_wei:BigInt(log.args.fee || 0).toString(),
            tax_wei:BigInt(log.args.tax || 0).toString(),
            price_eth:t > 0 ? q/t : 0
          };
        }).filter((row) => row.price_eth > 0);
        if (rows.length) {
          const { error: tradeError } = await supabase.from('market_trades').upsert(rows, { onConflict:'token_address,tx_hash,log_index', ignoreDuplicates:true });
          if (tradeError) throw tradeError;
          insertedTrades = rows.length;
        }
        await supabase.from('watches').update({ market_synced_block:Number(toBlock), updated_at:new Date().toISOString() }).eq('id',w.id);
      }

      const [tokenMeta, decimals, totalSupply] = await Promise.all([
        getBlockscoutToken(token),
        publicClient.readContract({address:token,abi:erc20Abi,functionName:'decimals'}).catch(()=>18),
        publicClient.readContract({address:token,abi:erc20Abi,functionName:'totalSupply'}).catch(()=>0n)
      ]);
      let priceEth = launch.phase === 0 ? await getCurveSpotPriceEth(curve).catch(()=>null) : null;
      if (priceEth == null) {
        const { data: lastTrade } = await supabase.from('market_trades').select('price_eth').eq('token_address',token.toLowerCase()).order('block_time',{ascending:false}).limit(1).maybeSingle();
        if (lastTrade?.price_eth != null) priceEth = Number(lastTrade.price_eth);
      }
      const supply = Number(formatUnits(totalSupply,Number(decimals)));
      const priceUsd = priceEth != null && ethUsd != null ? priceEth * ethUsd : (tokenMeta?.exchange_rate ? Number(tokenMeta.exchange_rate) : null);
      const marketCapUsd = priceUsd != null && Number.isFinite(supply) ? priceUsd*supply : null;
      const since = new Date(Date.now()-24*60*60*1000).toISOString();
      const { data: dayTrades } = await supabase.from('market_trades').select('quote_wei').eq('token_address',token.toLowerCase()).gte('block_time',since).limit(5000);
      const volumeEth = (dayTrades||[]).reduce((sum:any,row:any)=>sum+Number(formatUnits(BigInt(row.quote_wei),18)),0);
      const volume24hUsd = ethUsd != null ? volumeEth*ethUsd : null;
      await supabase.from('token_snapshots').insert({
        watch_id:w.id, token_address:token.toLowerCase(), holder_count:Number(tokenMeta?.holders_count||0), market_cap_usd:marketCapUsd,
        price_usd:priceUsd, price_eth:priceEth, volume_24h_usd:volume24hUsd, phase:launch.phaseLabel, source:'robinhood+pons'
      });
      results.push({ id:w.id, insertedTrades, syncedThrough:Number(toBlock), phase:launch.phaseLabel });
    }catch(err:any){ results.push({id:w.id,error:err?.message||'sync failed'}); }
  }
  return NextResponse.json({ok:true,latestBlock:Number(latestBlock),results});
}
