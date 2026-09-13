import { NextResponse } from 'next/server';
import { getSupabaseAdmin, hasSupabaseEnv, requireAdmin } from '@/lib/supabase';

export async function GET(request: Request){
  try{ requireAdmin(request); if(!hasSupabaseEnv) return NextResponse.json({ error:'Supabase not configured' },{status:503}); const supabase=getSupabaseAdmin(); const {data,error}=await supabase.from('watches').select('*').order('created_at',{ascending:false}); if(error) throw error; return NextResponse.json({watches:data}); }catch(err:any){return NextResponse.json({error:err.message},{status:401})}
}
