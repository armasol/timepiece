import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyMessage, isAddress } from 'viem';
import { demoWatches } from '@/lib/demo';
import { getSupabaseAdmin, hasSupabaseEnv } from '@/lib/supabase';

const WatchSchema = z.object({
  slug: z.string().min(2).max(180), brand: z.string().min(1).max(80), model: z.string().min(1).max(120), reference_number: z.string().max(120).nullable().optional(),
  year: z.number().int().min(1800).max(new Date().getFullYear()+1).nullable().optional(), condition: z.enum(['Unworn','Excellent','Very Good','Good','Fair']),
  appraised_value_usd: z.number().positive().max(100_000_000), tokenized_percent: z.number().min(1).max(100), owner_wallet: z.string().refine(isAddress, 'Invalid wallet address'),
  primary_image_url: z.string().url().nullable().optional(), verification_image_url: z.string().url().nullable().optional(), verification_code: z.string().min(6), description: z.string().max(4000).nullable().optional(),
  verification_status: z.literal('submitted').default('submitted'), published: z.literal(false).default(false), box_papers: z.boolean().default(false), serial_verified: z.boolean().default(false), signature: z.string().startsWith('0x'),
  additional_images: z.array(z.object({ image_url: z.string().url(), image_type: z.enum(['front','back','side','clasp','serial','box_papers','appraisal','other']) })).max(12).optional().default([])
});

export async function GET(){
  if(!hasSupabaseEnv) {
    if (process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA === 'true') return NextResponse.json({ watches: demoWatches, demo: true });
    return NextResponse.json({ watches: [], demo: false, configured: false });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('watches').select('*').eq('published', true).order('created_at', { ascending:false });
  if(error) return NextResponse.json({ error: error.message }, { status: 500 });
  const ids = (data || []).map((w:any) => w.id);
  const { data: snapshots } = ids.length ? await supabase.from('token_snapshots').select('*').in('watch_id', ids).order('created_at', { ascending:false }) : { data: [] as any[] };
  const latestByWatch = new Map<string, any>();
  for (const s of snapshots || []) if (!latestByWatch.has(s.watch_id)) latestByWatch.set(s.watch_id, s);
  return NextResponse.json({ watches: (data || []).map((w:any) => ({ ...w, market: latestByWatch.get(w.id) || null })) });
}

export async function POST(request: Request){
  try{
    if(!hasSupabaseEnv) return NextResponse.json({ error: 'Supabase is not configured. Add env vars and run supabase/schema.sql.' }, { status: 503 });
    const json = WatchSchema.parse(await request.json());
    const { additional_images, ...watchRow } = json;
    const message=`Timepiece listing verification\nWallet: ${json.owner_wallet}\nCode: ${json.verification_code}\nWatch: ${json.brand} ${json.model} ${json.reference_number || ''}`;
    const validSignature = await verifyMessage({ address: json.owner_wallet as `0x${string}`, message, signature: json.signature as `0x${string}` });
    if (!validSignature) return NextResponse.json({ error: 'Wallet signature could not be verified.' }, { status: 401 });

    const supabase = getSupabaseAdmin();
    const { data: verification, error: verificationError } = await supabase.from('verification_codes').select('*').eq('code', json.verification_code).maybeSingle();
    if (verificationError) throw verificationError;
    if (!verification || verification.consumed_at || new Date(verification.expires_at).getTime() < Date.now()) return NextResponse.json({ error: 'Verification code is invalid or expired. Generate a new code.' }, { status: 400 });
    if (!json.primary_image_url || !json.verification_image_url) return NextResponse.json({ error: 'Upload both the watch photo and the possession-verification photo.' }, { status: 400 });

    const { data, error } = await supabase.from('watches').insert(watchRow).select('*').single();
    if(error) return NextResponse.json({ error: error.message }, { status: 500 });
    await supabase.from('verification_codes').update({ consumed_at: new Date().toISOString(), watch_id: data.id }).eq('id', verification.id);
    if (additional_images.length) {
      const rows = additional_images.map((image) => ({ watch_id: data.id, image_url: image.image_url, image_type: image.image_type }));
      const { error: imagesError } = await supabase.from('watch_images').insert(rows);
      if (imagesError) console.error('Could not persist additional watch images', imagesError);
    }
    return NextResponse.json({ watch: data });
  } catch(err:any){ return NextResponse.json({ error: err?.issues?.[0]?.message || err?.message || 'Invalid request' }, { status: 400 }); }
}
