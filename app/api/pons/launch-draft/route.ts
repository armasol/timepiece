import { NextResponse } from 'next/server';
import { getPonsStatus, makeSymbol, NATIVE_PAIR } from '@/lib/pons';
import { isAddress } from 'viem';
import { randomBytes } from 'node:crypto';

export const runtime = 'nodejs';

export async function POST(request: Request){
 try{
   const body=await request.json();
   if(!isAddress(body.creatorFeeRecipient)) return NextResponse.json({error:'Invalid creator wallet'},{status:400});
   const launcher = body.launcher && isAddress(body.launcher) ? body.launcher : body.creatorFeeRecipient;
   const status=await getPonsStatus(launcher);
   const creatorTaxBps = Math.max(0, Math.min(Number(body.creatorTaxBps || process.env.PONS_CREATOR_TAX_BPS || 0), status.maxCreatorTaxBps));
   const salt = `0x${randomBytes(32).toString('hex')}`;
   const name = `${body.brand} ${body.model} ${body.reference_number || ''}`.replace(/\s+/g,' ').trim();
   const symbol = makeSymbol(body.brand, body.reference_number);
   return NextResponse.json({
     factory: status.factory,
     launchFeeWei: status.launchFeeWei,
     launchFeeEth: status.launchFeeEth,
     launchConfigId: status.launchConfigId,
     pairToken: NATIVE_PAIR,
     canLaunch: status.canLaunch,
     tokenParams: {
       name, symbol, logo: body.logo || body.primary_image_url || '',
       description: body.description || `${name}. Watch record on Timepiece.${body.year ? ` Year: ${body.year}.` : ''}${body.condition ? ` Condition: ${body.condition}.` : ''}`,
       socials: { twitter:'', telegram:'', discord:'', website: process.env.NEXT_PUBLIC_SITE_URL || '', farcaster:'' },
       creatorFeeRecipient: body.creatorFeeRecipient,
       creatorTaxBps,
       buybackEnabled: Boolean(body.buybackEnabled ?? true),
       expectedEconomics: status.expectedEconomics,
       salt
     }
   });
 }catch(err:any){return NextResponse.json({error:err?.message || 'Unable to prepare launch'},{status:500})}
}
