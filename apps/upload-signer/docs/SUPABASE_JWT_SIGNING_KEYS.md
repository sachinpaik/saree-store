# Supabase JWT signing keys (ECC / ES256) and upload-signer

If Supabase shows **only a key ID** (UUID) for your signing key — **not** a copyable shared secret — you are using **asymmetric** signing (for example **ECC** with **P-256**, which produces **ES256** JWTs).

You **cannot** paste a “JWT secret” into the Worker for those tokens. Verification uses the **public** keys published by Supabase at:

`https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json`

The upload-signer Worker fetches that **JWKS** automatically when **`SUPABASE_URL`** is set.

---

## What to set on the Worker

| Worker secret | Required? | Value |
|---------------|-----------|--------|
| **`SUPABASE_URL`** | **Yes** for ECC | Your project **API URL** (same as **`NEXT_PUBLIC_SUPABASE_URL`**), e.g. `https://abcdefghijklmnop.supabase.co` — **no trailing slash** |
| **`SUPABASE_JWT_SECRET`** | Only for **Legacy HS256** | Omit or remove if you **only** use ECC/ES256 |

---

## GitHub Actions

1. Add repository secret **`UPLOAD_SIGNER_SUPABASE_URL`** = same `https://….supabase.co` URL.  
2. **Remove or leave empty** **`SUPABASE_JWT_SECRET`** if you no longer use HS256.  
3. Re-run **Deploy upload-signer**.

If an old **`SUPABASE_JWT_SECRET`** is still stored on the Worker, it is harmless for verification (JWKS is used for ES256 tokens). You can delete the unused secret in the Cloudflare dashboard if you want.

---

## Why you only see “key-id”

Asymmetric keys are a **key pair**: private key stays in Supabase (never shown), public keys are exposed via **JWKS**. The dashboard only needs to show **key IDs** (e.g. for rotation). Your app still sends normal **Bearer** access tokens; the Worker verifies them with **JWKS**, not with a shared secret.

---

## After switching from HS256 to ECC

1. Set **`SUPABASE_URL`** on the Worker.  
2. **Sign out** and **sign in** again in the admin app so you get a token signed with the new key.  
3. Ensure **`upload-signer` CORS** allows your admin origin (`UPLOAD_SIGNER_CORS_ORIGINS` or unset for dev).

---

## Troubleshooting

| Issue | Check |
|--------|--------|
| `invalid_token` (401) | `SUPABASE_URL` matches the **same** project as the admin app; Worker redeployed after setting secrets |
| `missing_auth_env` (500) | At least one of `SUPABASE_URL` or `SUPABASE_JWT_SECRET` must be set |
| Still fails | Decode JWT header at [jwt.io](https://jwt.io) — `alg` should be **`ES256`** for ECC P-256 |

---

See also: [SUPABASE_JWT_HS256.md](./SUPABASE_JWT_HS256.md) (legacy shared secret), [DEPLOY_FROM_GITHUB.md](./DEPLOY_FROM_GITHUB.md).
