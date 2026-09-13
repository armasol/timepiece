import { NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { getSupabaseAdmin, hasSupabaseEnv, requireAdmin } from '@/lib/supabase';

const ALLOWED = new Set([
  'verification_status','published','pons_token_address','pons_curve_address',
  'pons_launch_tx_hash','pons_launch_block','appraised_value_usd','tokenized_percent',
  'description','serial_verified','box_papers'
]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(request);
    if (!hasSupabaseEnv) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    const { id } = await params;
    const input = await request.json();
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) if (ALLOWED.has(key)) patch[key] = value;
    if ('pons_token_address' in patch && patch.pons_token_address && !isAddress(String(patch.pons_token_address))) return NextResponse.json({ error: 'Invalid token address' }, { status: 400 });
    if ('pons_curve_address' in patch && patch.pons_curve_address && !isAddress(String(patch.pons_curve_address))) return NextResponse.json({ error: 'Invalid curve address' }, { status: 400 });
    if ('pons_launch_tx_hash' in patch && patch.pons_launch_tx_hash && !/^0x[a-fA-F0-9]{64}$/.test(String(patch.pons_launch_tx_hash))) return NextResponse.json({ error: 'Invalid transaction hash' }, { status: 400 });
    if (!Object.keys(patch).length) return NextResponse.json({ error: 'No editable fields supplied' }, { status: 400 });
    patch.updated_at = new Date().toISOString();
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('watches').update(patch).eq('id', id).select('*').single();
    if (error) throw error;
    await supabase.from('admin_events').insert({ action: 'watch.patch', watch_id: id, payload: patch });
    return NextResponse.json({ watch: data });
  } catch (err: any) {
    const message = err?.message || 'Update failed';
    return NextResponse.json({ error: message }, { status: message === 'Unauthorized' ? 401 : 500 });
  }
}
