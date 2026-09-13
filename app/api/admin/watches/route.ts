import { NextResponse } from 'next/server';
import { getSupabaseAdmin, hasSupabaseEnv, requireAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request){
  try{
    requireAdmin(request);
    if(!hasSupabaseEnv) return NextResponse.json({ error:'Supabase not configured' },{status:503});
    const supabase=getSupabaseAdmin();
    const {data,error}=await supabase.from('watches').select('*').order('created_at',{ascending:false});
    if(error) throw error;
    return NextResponse.json({watches:data});
  }catch(err:any){
    const message=err?.message||'Unable to load admin data';
    const status=message==='Unauthorized'?401:message.includes('not configured')?503:500;
    return NextResponse.json({error:message},{status});
  }
}
