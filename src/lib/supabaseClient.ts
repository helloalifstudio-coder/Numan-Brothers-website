import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * A public key is safe in the browser ONLY in combination with verified RLS.
 * Never place service-role/secret keys or database passwords in VITE_* variables.
 */
const url = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  || import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

export const isCmsConfigured = /^https:\/\/[a-z0-9.-]+\.supabase\.co$/i.test(url) && publishableKey.length > 25;
export const cmsProjectUrl = isCmsConfigured ? url : '';

let singleton: SupabaseClient | null = null;
export function getCmsClient(): SupabaseClient | null {
  if (!isCmsConfigured) return null;
  if (!singleton) {
    singleton = createClient(url, publishableKey, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
    });
  }
  return singleton;
}
