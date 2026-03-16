import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client for public storefront data only. Does NOT use cookies(),
 * so it is safe for build-time static generation (no request context).
 * Use only for read-only public data (approved products, site_settings, etc.).
 * Admin and auth flows must continue to use createClient() from server.ts.
 */
export function createStorefrontClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required");
  return createClient(url, key);
}
