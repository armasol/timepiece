import { NextResponse } from 'next/server';
import { isAddress } from 'viem';
export async function GET(_: Request, { params }: { params: Promise<{ address: string }> }){
 const { address } = await params; if(!isAddress(address)) return NextResponse.json({error:'Invalid token address'},{status:400});
 try{
   const base=`https://robinhoodchain.blockscout.com/api/v2/tokens/${address}`;
   const res=await fetch(base,{next:{revalidate:30}});
   if(!res.ok) return NextResponse.json({ market:{tokenAddress:address,holders:null,candles:[]} });
   const data=await res.json();
   return NextResponse.json({ market:{ tokenAddress:address, name:data.name, symbol:data.symbol, holders:Number(data.holders_count||0), marketCapUsd:data.exchange_rate?Number(data.exchange_rate)*Number(data.total_supply||0)/Math.pow(10,Number(data.decimals||18)):null, priceUsd:data.exchange_rate?Number(data.exchange_rate):null, candles:[] } });
 }catch(err:any){ return NextResponse.json({error:err.message},{status:500}); }
}
