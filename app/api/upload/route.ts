import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getSupabaseAdmin, hasSupabaseEnv } from '@/lib/supabase';

export const runtime = 'nodejs';
const MAX_BYTES = 12 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg','image/png','image/webp']);

export async function POST(request: Request){
  if(!hasSupabaseEnv) return NextResponse.json({error:'Supabase storage is not configured'},{status:503});
  const form=await request.formData(); const file=form.get('file') as File | null; const rawPath=(form.get('path') as string)||'watch';
  if(!file) return NextResponse.json({error:'Missing file'},{status:400});
  if(!ALLOWED.has(file.type)) return NextResponse.json({error:'Upload a JPG, PNG, or WebP image.'},{status:400});
  if(file.size > MAX_BYTES) return NextResponse.json({error:'Image must be 12 MB or smaller.'},{status:400});
  const supabase=getSupabaseAdmin();
  const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
  const safePath=rawPath.replace(/[^a-zA-Z0-9/_-]/g,'').replace(/^\/+|\/+$/g,'').slice(0,180) || 'watch';
  const key=`${safePath}-${randomUUID()}.${ext}`;
  const bytes=Buffer.from(await file.arrayBuffer());
  const {error}=await supabase.storage.from('watch-images').upload(key,bytes,{upsert:false,contentType:file.type,cacheControl:'31536000'}); if(error) return NextResponse.json({error:error.message},{status:500});
  const {data}=supabase.storage.from('watch-images').getPublicUrl(key); return NextResponse.json({url:data.publicUrl,path:key});
}
