import { NextResponse } from 'next/server';
import { getPonsStatus } from '@/lib/pons';
import { isAddress } from 'viem';
export const dynamic = 'force-dynamic';
export async function GET(request: Request){
 try{ const url=new URL(request.url); const launcher=url.searchParams.get('launcher'); const status=await getPonsStatus(launcher&&isAddress(launcher)?launcher as `0x${string}`:undefined); return NextResponse.json(status); }catch(err:any){ return NextResponse.json({error:err?.message || 'Pons unavailable'},{status:500}); }
}
