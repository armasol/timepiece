import { createClient } from '@supabase/supabase-js';

export const hasSupabaseEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  return createClient(url, key);
}

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false } });
}

export function requireAdmin(request: Request) {
  const expected = process.env.TIMEPIECE_ADMIN_KEY;
  const provided = request.headers.get('x-timepiece-admin-key');
  if (!expected || expected === 'change-this-before-production') {
    throw new Error('TIMEPIECE_ADMIN_KEY is not configured');
  }
  if (provided !== expected) throw new Error('Unauthorized');
}
