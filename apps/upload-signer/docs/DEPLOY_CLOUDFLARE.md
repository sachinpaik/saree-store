# Deploy upload-signer on Cloudflare Workers

The upload-signer is a **Cloudflare Worker** (not Pages). It exposes `POST /sign-upload` and holds R2 signing secrets.

## Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/)
- [Node.js](https://nodejs.org/) 18+
- Wrangler CLI (installed via npm in this project)

## 1. Install and log in

```bash
cd apps/upload-signer
npm install
npx wrangler login
```

## 2. Create R2 bucket (if needed)

In Cloudflare Dashboard → **R2** → Create bucket. Note the bucket name for secrets.

## 3. Set Worker secrets

Run each command and paste the value when prompted (values are **not** stored in `wrangler.toml`):

```bash
npx wrangler secret put CLOUDFLARE_R2_ACCOUNT_ID
npx wrangler secret put CLOUDFLARE_R2_ACCESS_KEY_ID
npx wrangler secret put CLOUDFLARE_R2_SECRET_ACCESS_KEY
npx wrangler secret put CLOUDFLARE_R2_BUCKET
npx wrangler secret put SUPABASE_JWT_SECRET
```

- **R2 credentials:** R2 → Overview → *Manage R2 API Tokens* (or S3-compatible credentials for your account).
- **`SUPABASE_JWT_SECRET`:** Supabase Dashboard → Project → **Settings** → **API** → **JWT Secret** (used to verify admin JWTs with HS256).

## 4. Optional: restrict CORS (production)

**Do not commit real admin URLs in Git** (e.g. in `wrangler.toml`). Use one of these:

### A. Cloudflare Dashboard (recommended)

1. **Workers & Pages** → your worker → **Settings** → **Variables**.
2. Add a **plain text** variable (not a secret): **Variable name** `CORS_ORIGINS`, **Value** a comma-separated list of allowed origins (no spaces, or trim in worker — the worker trims each entry), e.g. your admin Pages URL and custom domain.
3. Save and redeploy if the dashboard prompts you, or run `npm run deploy` again.

If `CORS_ORIGINS` is unset, the worker allows any origin (OK for early dev; tighten for production).

### B. Deploy-time (CI / CLI)

Pass the variable when deploying so values live in **GitLab CI/CD variables** (or your shell), not in the repo:

```bash
cd apps/upload-signer
npx wrangler deploy --var CORS_ORIGINS:"https://your-admin.pages.dev,https://admin.example.com"
```

In **GitLab CI**, define a masked variable `CORS_ORIGINS` and use:

```bash
npx wrangler deploy --var CORS_ORIGINS:"${CORS_ORIGINS}"
```

### C. Local dev only

Create **`apps/upload-signer/.dev.vars`** (gitignored) with:

```bash
CORS_ORIGINS=http://localhost:3000
```

This file must not be committed; use it only on your machine.

## 5. Deploy

```bash
cd apps/upload-signer
npm run deploy
```

Wrangler prints the Worker URL, e.g.:

`https://upload-signer.<your-subdomain>.workers.dev`

### Extra endpoints (for static / SPA admin clients)

Same Worker, same admin JWT (`Authorization: Bearer <supabase_access_token>`):

| Path | Body | Purpose |
|------|------|---------|
| `POST /finalize-temp` | `{ "productId": "…", "tempKeys": ["temp/…", …] }` | Copy temp uploads to `{productId}/…` in R2 (server-side; no secrets in browser). |
| `POST /delete-objects` | `{ "keys": ["path/…", …] }` | Delete R2 objects by key (admin only). |

CORS is the same as `/sign-upload`. Use these if the admin is built as **fully static** and cannot hold R2 API credentials.

## 6. Point the admin app at this Worker

In **`apps/admin`** (local `.env.local` or Cloudflare Pages / Vercel env):

```bash
NEXT_PUBLIC_UPLOAD_SIGNER_URL=https://upload-signer.<your-subdomain>.workers.dev
```

No trailing slash. Admin calls `POST {NEXT_PUBLIC_UPLOAD_SIGNER_URL}/sign-upload`.

## 7. Custom domain (optional)

Cloudflare Dashboard → **Workers & Pages** → your worker → **Triggers** → **Custom Domains** → add e.g. `upload-api.yourdomain.com`.

Update `NEXT_PUBLIC_UPLOAD_SIGNER_URL` to that HTTPS URL.

## 8. Verify

```bash
# Should return 401 without Authorization
curl -s -o /dev/null -w "%{http_code}" -X POST https://<worker-url>/sign-upload
```

Then test image upload from the deployed **admin** app with a valid admin session.

## Troubleshooting

| Issue | Check |
|-------|--------|
| 403 from worker | JWT valid but `app_metadata.role !== "admin"` in Supabase |
| CORS error in browser | Set `CORS_ORIGINS` to your admin origin, or allow `*` during dev |
| Presign 500 | R2 secret names / bucket name; account ID matches R2 dashboard |

See also: [README.md](../README.md) in this folder.

**Deploy from GitHub:** [DEPLOY_FROM_GITHUB.md](./DEPLOY_FROM_GITHUB.md) (API token, `CLOUDFLARE_ACCOUNT_ID`, example workflow).
