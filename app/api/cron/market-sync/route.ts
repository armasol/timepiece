import { NextResponse } from 'next/server';
import { getSupabaseAdmin, hasSupabaseEnv } from '@/lib/supabase';

export async function GET(request: Request){
  const auth = request.headers.get('authorization');
  if(process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({error:'Unauthorized'},{status:401});
  if(!hasSupabaseEnv) return NextResponse.json({error:'Supabase not configured'},{status:503});
  const supabase=getSupabaseAdmin();
  const {data:watches,error}=await supabase.from('watches').select('id,pons_token_address').not('pons_token_address','is',null).eq('published',true);
  if(error) return NextResponse.json({error:error.message},{status:500});
  let inserted=0;
  for(const w of watches||[]){
    try{
      const r=await fetch(`https://robinhoodchain.blockscout.com/api/v2/tokens/${w.pons_token_address}`);
      if(!r.ok) continue; const t=await r.json();
      await supabase.from('token_snapshots').insert({ watch_id:w.id, token_address:w.pons_token_address, holder_count:Number(t.holders_count||0), price_usd:t.exchange_rate?Number(t.exchange_rate):null, market_cap_usd:t.exchange_rate?Number(t.exchange_rate)*Number(t.total_supply||0)/Math.pow(10,Number(t.decimals||18)):null, source:'blockscout' });
      inserted++;
    }catch{}
  }
  return NextResponse.json({ok:true,scanned:watches?.length||0,inserted});
}
