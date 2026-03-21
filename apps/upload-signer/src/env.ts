export interface Env {
  CLOUDFLARE_R2_ACCOUNT_ID: string;
  CLOUDFLARE_R2_ACCESS_KEY_ID: string;
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: string;
  CLOUDFLARE_R2_BUCKET: string;
  /**
   * Legacy HS256 shared secret (Supabase → API → JWT Secret, or JWT signing keys → Legacy HS256).
   * Omit if you only use asymmetric keys (ECC/ES256) — then set SUPABASE_URL for JWKS verification.
   */
  SUPABASE_JWT_SECRET?: string;
  /**
   * Project URL, e.g. https://xxxx.supabase.co (same as NEXT_PUBLIC_SUPABASE_URL).
   * Required for ECC (P-256) / ES256 JWTs — public keys are fetched from /auth/v1/.well-known/jwks.json (no shared secret in UI).
   */
  SUPABASE_URL?: string;
  CORS_ORIGINS?: string;
}
