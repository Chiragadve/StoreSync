import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const fallbackUrl = 'https://example.supabase.co';
const fallbackAnonKey = 'missing-anon-key';

export const supabase = createClient(
  supabaseUrl ?? fallbackUrl,
  supabaseAnonKey ?? fallbackAnonKey,
  {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    );
  }
}

export function getSupabaseEnv() {
  return {
    supabaseUrl: supabaseUrl ?? '',
    supabaseAnonKey: supabaseAnonKey ?? '',
  };
}
