import { NextResponse } from 'next/server';
import { z } from 'zod';
import { demoWatches } from '@/lib/demo';
import { getSupabaseAdmin, hasSupabaseEnv } from '@/lib/supabase';

const WatchSchema = z.object({
  slug: z.string().min(2), brand: z.string().min(1), model: z.string().min(1), reference_number: z.string().nullable().optional(), year: z.number().int().nullable().optional(), condition: z.string(), appraised_value_usd: z.number().positive(), tokenized_percent: z.number().min(1).max(100), owner_wallet: z.string().startsWith('0x'), primary_image_url: z.string().nullable().optional(), verification_image_url: z.string().nullable().optional(), verification_code: z.string().nullable().optional(), description: z.string().nullable().optional(), verification_status: z.string().default('submitted'), published: z.boolean().default(false), box_papers: z.boolean().default(false), serial_verified: z.boolean().default(false), signature: z.string().optional()
});

export async function GET(){
  if(!hasSupabaseEnv) return NextResponse.json({ watches: demoWatches, demo: true });
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('watches').select('*').eq('published', true).order('created_at', { ascending:false });
  if(error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ watches: data });
}

export async function POST(request: Request){
  try{
    if(!hasSupabaseEnv) return NextResponse.json({ error: 'Supabase is not configured. Add env vars and run supabase/schema.sql.' }, { status: 503 });
    const json = WatchSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('watches').insert(json).select('*').single();
    if(error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ watch: data });
  } catch(err:any){ return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 }); }
}
