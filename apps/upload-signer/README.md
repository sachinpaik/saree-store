# upload-signer

Minimal Cloudflare Worker that issues R2 presigned PUT URLs for direct browser uploads. Verifies the caller is an authenticated admin via Supabase JWT.

**Location:** `apps/upload-signer` (deploy with Wrangler from this folder).

## 1. Files

| File | Purpose |
|------|--------|
| `src/index.ts` | Single handler: POST `/sign-upload`, auth + presign |
| `package.json` | deps: jose, wrangler, typescript |
| `wrangler.toml` | Worker config; secrets via `wrangler secret put` |
| `tsconfig.json` | TypeScript for Workers |
| `README.md` | This file |

## 2. Deploy

```bash
cd apps/upload-signer && npm install && npm run deploy
```

Set secrets: `CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET`, `SUPABASE_JWT_SECRET` via `wrangler secret put`.

Optional **CORS** allowlist: set plain variable `CORS_ORIGINS` in the Cloudflare Dashboard (Worker → Settings → Variables), or `wrangler deploy --var CORS_ORIGINS:"…"` from CI — **not** in committed `wrangler.toml`. See [docs/DEPLOY_CLOUDFLARE.md](./docs/DEPLOY_CLOUDFLARE.md).

**Full Cloudflare Worker deployment guide:** [docs/DEPLOY_CLOUDFLARE.md](./docs/DEPLOY_CLOUDFLARE.md) (login, secrets, CORS, custom domain, troubleshooting).

**Deploy from GitHub (Actions + secrets):** [docs/DEPLOY_FROM_GITHUB.md](./docs/DEPLOY_FROM_GITHUB.md)

## 3. Admin app

In `apps/admin` `.env.local`:

```bash
NEXT_PUBLIC_UPLOAD_SIGNER_URL=https://upload-signer.<your-subdomain>.workers.dev
```

**Required.** The admin app only calls this worker for presigned uploads (`apps/admin/src/lib/upload-signer.ts`). There is no in-app `/api/upload-sign` fallback.

## 4. API (POST `/sign-upload`)

- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <supabase_access_token>`
- **Body:**
  ```json
  {
    "fileName": "saree.jpg",
    "contentType": "image/jpeg",
    "productId": "uuid-or-session-id",
    "mode": "temp" | "final"
  }
  ```
- **200 response:** `{ "putUrl": "...", "storageKey": "..." }`
- **Errors:** 401 (auth), 403 (not admin), 400 (bad body), 500 (presign failure)
- **CORS:** `Access-Control-Allow-Origin` reflects request `Origin` (or `*`); optional env `CORS_ORIGINS` (comma-separated) to restrict.
- **Presign:** PUT to R2, `Content-Type` signed, expiry **15 minutes**.

All documentation for this worker lives in **this folder** (`README.md` only).

## 5. Manual test checklist

- [ ] Deploy worker from `apps/upload-signer`
- [ ] Set `NEXT_PUBLIC_UPLOAD_SIGNER_URL` in admin and verify image upload on new/edit product flows
- [ ] `POST /sign-upload` without `Authorization` → 401
- [ ] Valid admin token + valid body → 200 with `putUrl` and `storageKey`
