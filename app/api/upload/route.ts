import { NextResponse } from 'next/server';
import { getSupabaseAdmin, hasSupabaseEnv } from '@/lib/supabase';

export async function POST(request: Request){
  if(!hasSupabaseEnv) return NextResponse.json({error:'Supabase storage is not configured'},{status:503});
  const form=await request.formData(); const file=form.get('file') as File | null; const path=(form.get('path') as string)||`watch-${Date.now()}`;
  if(!file) return NextResponse.json({error:'Missing file'},{status:400});
  const supabase=getSupabaseAdmin(); const ext=file.name.split('.').pop()||'jpg'; const key=`${path}.${ext}`;
  const {error}=await supabase.storage.from('watch-images').upload(key,file,{upsert:false,contentType:file.type}); if(error) return NextResponse.json({error:error.message},{status:500});
  const {data}=supabase.storage.from('watch-images').getPublicUrl(key); return NextResponse.json({url:data.publicUrl,path:key});
}
