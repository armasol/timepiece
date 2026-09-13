'use client';
import { useEffect, useRef, useState } from 'react';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { WatchListing, TokenMarket } from '@/lib/types';
import { useParams } from 'next/navigation';
import { createChart, ColorType } from 'lightweight-charts';
import { useWallet } from '@/components/WalletProvider';
import { parseEther } from 'viem';
import { ponsCurveAbi, publicClient, quoteCurveBuy } from '@/lib/pons';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';

function PriceChart({market}:{market?:TokenMarket}){
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!ref.current)return;const chart=createChart(ref.current,{layout:{background:{type:ColorType.Solid,color:'transparent'},textColor:'#aaa89d'},grid:{vertLines:{color:'rgba(255,255,255,.05)'},horzLines:{color:'rgba(255,255,255,.05)'}},rightPriceScale:{borderColor:'rgba(255,255,255,.1)'},timeScale:{borderColor:'rgba(255,255,255,.1)'}});const series=chart.addCandlestickSeries({upColor:'#d5fd51',downColor:'#76776e',borderVisible:false,wickUpColor:'#d5fd51',wickDownColor:'#76776e'});series.setData((market?.candles || []) as any);chart.timeScale().fitContent();const ro=new ResizeObserver(()=>{if(ref.current)chart.applyOptions({width:ref.current.clientWidth})});ro.observe(ref.current);return()=>{ro.disconnect();chart.remove()}},[market]);
 return <div className="chart" ref={ref}/>;
}

export default function WatchDetail(){
 const params=useParams(); const wallet=useWallet();
 const [watch,setWatch]=useState<WatchListing|null>(null); const [market,setMarket]=useState<TokenMarket|null>(null); const [amount,setAmount]=useState('0.01'); const [tradeStatus,setTradeStatus]=useState('');
 useEffect(()=>{fetch(`/api/watches/${params.id}`).then(r=>r.json()).then(async d=>{setWatch(d.watch); if(d.watch?.pons_token_address){const m=await fetch(`/api/pons/token/${d.watch.pons_token_address}`).then(r=>r.json()); if(m.market)setMarket(m.market)}}).catch(()=>{})},[params.id]);
 async function buy(){
   if(!watch?.pons_curve_address) return setTradeStatus('This watch does not have a live curve attached yet.');
   if(!wallet.address) return setTradeStatus('Connect your wallet first.');
   if(process.env.NEXT_PUBLIC_ENABLE_MAINNET_ACTIONS !== 'true') return setTradeStatus('Trading is disabled until NEXT_PUBLIC_ENABLE_MAINNET_ACTIONS=true is set in Vercel.');
   if(market?.phase && market.phase !== 'curve') return setTradeStatus('This token has graduated from its Pons curve. Pool trading routing is not enabled in this interface yet.');
   try {setTradeStatus('Quoting against the live Pons curve…'); const quoteIn=parseEther(amount); const quote=await quoteCurveBuy(watch.pons_curve_address as `0x${string}`,quoteIn,wallet.address); if(quote.tokensOut<=0n) return setTradeStatus('The curve cannot fill that buy right now.'); const minTokensOut=quote.tokensOut*97n/100n; setTradeStatus('Confirm the trade in your wallet…'); const hash=await wallet.writeContract({address:watch.pons_curve_address as `0x${string}`,abi:ponsCurveAbi,functionName:'buy',args:[quoteIn,minTokensOut,wallet.address],value:quoteIn} as any);setTradeStatus('Transaction sent. Waiting for Robinhood Chain…');await publicClient.waitForTransactionReceipt({hash});setTradeStatus(`Buy confirmed: ${hash.slice(0,10)}…`);}
   catch(e:any){setTradeStatus(e?.shortMessage||e?.message||'Trade cancelled.');}
 }
 const image = watch?.primary_image_url;
 return <main className="page"><Nav/><section className="section" style={{paddingTop:150}}><div className="container split" style={{alignItems:'start'}}><div><div className="watch-art panel detail-watch-art" style={image?{backgroundImage:`linear-gradient(rgba(5,6,5,.06),rgba(5,6,5,.25)),url(${image})`}:undefined}>{!image&&<div className="mini-watch" style={{width:260,height:260}}/>}</div>{watch?.images?.length? <div className="watch-gallery">{watch.images.map((img,i)=><div key={img.id||`${img.image_type}-${i}`} className="watch-gallery-thumb" style={{backgroundImage:`url(${img.image_url})`}}><span>{img.image_type.replace('_',' ')}</span></div>)}</div>:null}<div className="verification-line"><CheckCircle2 size={16}/>{watch?.verification_status?.replace('_',' ') || 'Loading verification'}</div><h1 className="h2 serif" style={{fontSize:'clamp(48px,6vw,88px)'}}>{watch?.brand} <em>{watch?.model}</em></h1><p className="lead">{watch?.description}</p></div><div className="panel trade-panel"><div className="kicker">Token market</div><h2>{watch?.reference_number || 'Watch market'}</h2><div className="metric-row"><div className="metric"><span>Appraised</span><b>{watch?`$${watch.appraised_value_usd.toLocaleString()}`:'—'}</b></div><div className="metric"><span>Holders</span><b>{market?.holders ?? '—'}</b></div><div className="metric"><span>Market cap</span><b>{market?.marketCapUsd?`$${Math.round(market.marketCapUsd).toLocaleString()}`:'—'}</b></div><div className="metric"><span>Condition</span><b>{watch?.condition || '—'}</b></div></div><div style={{margin:'24px 0'}}><PriceChart market={market||undefined}/>{!market?.candles?.length&&<p className="microcopy">Real trade history will appear here as soon as the linked Pons token has indexed trades.</p>}</div><label className="label">ETH amount<input className="input" inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)}/></label><button className="pill green trade-button" onClick={buy}>Buy watch token <ArrowUpRight size={16}/></button>{tradeStatus&&<p className="form-status">{tradeStatus}</p>}<p className="microcopy">Trades execute from your wallet on Robinhood Chain. You approve every transaction.</p></div></div></section><Footer/></main>;
}
