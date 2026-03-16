import { createClient } from "@supabase/supabase-js";

/**
 * Cookie-less Supabase client for static storefront only.
 * Safe for build-time data fetch (no cookies() / request context).
 * Do not use for admin or auth.
 */
export function createStorefrontSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required for storefront");
  }
  return createClient(url, key);
}
