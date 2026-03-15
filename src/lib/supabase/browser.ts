import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client for auth and client-side data.
 * Uses cookies for session persistence (persistSession: true, autoRefreshToken: true).
 * Do not use in Server Components or middleware.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
}
