import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Server routes in this project use the service role so submissions, verification,
// indexing and admin updates work even with strict RLS policies.
export const hasSupabaseEnv = Boolean(url && serviceRoleKey);

export function getSupabaseBrowser() {
  if (!url || !anonKey) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  return createClient(url, anonKey);
}

export function getSupabaseAdmin() {
  if (!url || !serviceRoleKey) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function requireAdmin(request: Request) {
  const expected = process.env.TIMEPIECE_ADMIN_KEY;
  const provided = request.headers.get('x-timepiece-admin-key');
  if (!expected || expected === 'change-this-before-production') throw new Error('TIMEPIECE_ADMIN_KEY is not configured');
  if (provided !== expected) throw new Error('Unauthorized');
}
