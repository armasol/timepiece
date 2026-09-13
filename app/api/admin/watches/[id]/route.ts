import { NextResponse } from 'next/server';
import { getSupabaseAdmin, hasSupabaseEnv, requireAdmin } from '@/lib/supabase';

export async function PATCH(request: Request, { params }: { params: Promise<{id:string}> }){
  try{ requireAdmin(request); if(!hasSupabaseEnv) return NextResponse.json({error:'Supabase not configured'},{status:503}); const {id}=await params; const body=await request.json(); const allowed=['verification_status','published','pons_token_address','pons_curve_address','appraised_value_usd','primary_image_url','description']; const patch=Object.fromEntries(Object.entries(body).filter(([k])=>allowed.includes(k))); const supabase=getSupabaseAdmin(); const {data,error}=await supabase.from('watches').update({...patch,updated_at:new Date().toISOString()}).eq('id',id).select('*').single(); if(error) throw error; return NextResponse.json({watch:data}); }catch(err:any){return NextResponse.json({error:err.message},{status:401})}
}
