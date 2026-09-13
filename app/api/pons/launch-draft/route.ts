import { NextResponse } from 'next/server';
import { getPonsStatus, makeSymbol, NATIVE_PAIR, DEFAULT_LAUNCH_CONFIG_ID } from '@/lib/pons';
import { isAddress } from 'viem';

export async function POST(request: Request){
 try{
   const body=await request.json();
   if(!isAddress(body.creatorFeeRecipient)) return NextResponse.json({error:'Invalid creator wallet'},{status:400});
   const status=await getPonsStatus(body.launcher && isAddress(body.launcher) ? body.launcher : body.creatorFeeRecipient);
   const salt = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,'0')).join('')}`;
   const name = `${body.brand} ${body.model} ${body.reference_number || ''}`.trim();
   const symbol = makeSymbol(body.brand, body.reference_number);
   return NextResponse.json({
     factory: status.factory,
     launchFeeWei: status.launchFeeWei,
     launchFeeEth: status.launchFeeEth,
     launchConfigId: DEFAULT_LAUNCH_CONFIG_ID.toString(),
     pairToken: NATIVE_PAIR,
     canLaunch: status.canLaunch,
     tokenParams: {
       name, symbol, logo: body.logo || body.primary_image_url || '',
       description: body.description || `${name}. Verified on Timepiece. Appraised value: $${body.appraised_value_usd}.`,
       socials: { twitter:'', telegram:'', discord:'', website: process.env.NEXT_PUBLIC_SITE_URL || '', farcaster:'' },
       creatorFeeRecipient: body.creatorFeeRecipient,
       creatorTaxBps: Number(body.creatorTaxBps || 0),
       buybackEnabled: Boolean(body.buybackEnabled ?? true),
       expectedEconomics: status.expectedEconomics,
       salt
     }
   });
 }catch(err:any){return NextResponse.json({error:err.message},{status:500})}
}
