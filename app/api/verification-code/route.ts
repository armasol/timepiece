import { NextResponse } from 'next/server';
import { randomInt } from 'node:crypto';
import { getSupabaseAdmin, hasSupabaseEnv } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(){
  const letters='ABCDEFGHJKLMNPQRSTUVWXYZ';
  const num=randomInt(1000,10000);
  const a=letters[randomInt(0,letters.length)];
  const b=letters[randomInt(0,letters.length)];
  const code=`TP-${num}-${a}${b}`;
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  if (hasSupabaseEnv) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('verification_codes').insert({ code, expires_at: expiresAt });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ code, expiresAt, expiresInMinutes:30 });
}
