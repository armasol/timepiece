import { NextResponse } from 'next/server';
import { demoWatches } from '@/lib/demo';
import { getSupabaseAdmin, hasSupabaseEnv } from '@/lib/supabase';

const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }){
  const { id } = await params;
  if(!hasSupabaseEnv){
    const watch = demoWatches.find(w => w.slug === id || w.id === id) || demoWatches[0];
    return NextResponse.json({ watch, demo: true });
  }
  const supabase = getSupabaseAdmin();
  const query = supabase.from('watches').select('*').eq('published', true);
  const { data, error } = uuidLike.test(id) ? await query.eq('id', id).single() : await query.eq('slug', id).single();
  if(error) return NextResponse.json({ error: 'Watch not found' }, { status: 404 });
  return NextResponse.json({ watch: data });
}
