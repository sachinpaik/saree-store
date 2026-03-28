# Supabase **Legacy HS256** (shared secret) with upload-signer

If your project uses **JWT signing keys** in Supabase and the active key is **Legacy HS256** (shared secret), the upload-signer Worker verifies tokens with **`SUPABASE_JWT_SECRET` only**. You **do not** need **`SUPABASE_URL`** on the Worker for verification (that path is for asymmetric / JWKS).

---

## 1. Which secret to copy

The value in the Worker secret **`SUPABASE_JWT_SECRET`** must be the **same shared secret** Supabase uses to **sign** user JWTs (access tokens), byte-for-byte.

Where to find it (Supabase UI names vary by version):

1. **Project Settings → API**  
   Copy **JWT Secret** (sometimes labeled as the legacy default).

2. **Or: Authentication / JWT / JWT signing keys**  
   Open **JWT signing keys**, find the **Legacy HS256** (or “Shared secret”) **current** / **standby** key that is actually **used to sign** tokens (often the **current** key).  
   Copy the **secret** string shown there — **not** the key ID / UUID alone.

Those two places should show the **same** secret for a simple legacy setup. If you **rotated** keys, the Worker must use the secret for whichever key is **currently signing** new sessions.

---

## 2. Set it on the Worker

- **Cloudflare** → **Workers** → **upload-signer** → **Settings** → **Variables** → secret **`SUPABASE_JWT_SECRET`**  
  Or via CI: GitHub secret **`SUPABASE_JWT_SECRET`** and redeploy the upload-signer workflow.

**Paste carefully:**

- No leading/trailing **spaces** or **newlines** (GitHub’s secret editor sometimes adds one).
- Use the **raw** secret string only — not the `anon` / `service_role` keys.

---

## 3. After changing the secret

1. **Redeploy** the Worker (or re-run the GitHub Action that syncs secrets).  
2. In the **admin** app, **sign out** and **sign in** again so the browser gets a **new** access token signed with the current secret.

---

## 4. Still `invalid_token`?

| Check | Action |
|--------|--------|
| Wrong project | Admin’s `NEXT_PUBLIC_SUPABASE_URL` must be the **same** Supabase project as the JWT secret you copied. |
| Rotated JWT secret | Copy the **current** signing secret again; old tokens may still work until expiry — sign out/in. |
| Token algorithm | Decode the JWT header (e.g. [jwt.io](https://jwt.io)) — `alg` should be **`HS256`** for this path. If it shows **`ES256`**, you need **`SUPABASE_URL`** + JWKS (see [DEPLOY_FROM_GITHUB.md](./DEPLOY_FROM_GITHUB.md)). |
| Secret typo | Re-paste `SUPABASE_JWT_SECRET` in Cloudflare/GitHub; avoid smart quotes or extra characters. |

---

## 5. Optional: `SUPABASE_URL` for Legacy HS256

**Not required** for verification when you only use HS256.  
You can omit **`UPLOAD_SIGNER_SUPABASE_URL`** / Worker **`SUPABASE_URL`** unless you also use asymmetric signing keys.

---

## Switched to ECC (P-256) / ES256?

You will only see **key IDs** in the dashboard — that is expected. Use **`SUPABASE_URL`** + JWKS: [SUPABASE_JWT_SIGNING_KEYS.md](./SUPABASE_JWT_SIGNING_KEYS.md).

---

See also: [DEPLOY_CLOUDFLARE.md](./DEPLOY_CLOUDFLARE.md), [DEPLOY_FROM_GITHUB.md](./DEPLOY_FROM_GITHUB.md).
