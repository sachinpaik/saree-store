# Storefront (static export for Cloudflare Pages)

Standalone static storefront app. Reuses `src/storefront` from the repo root. Build outputs to `out/` for deployment to Cloudflare Pages.

## Prerequisites

- Node 18+
- Supabase project (for product data at build time)
- Env vars (see below)

## Local development

```bash
# From repo root, copy env so the app can reach Supabase
cp .env.local apps/storefront/.env.local   # or set in shell

cd apps/storefront
npm install
npm run dev
```

Open http://localhost:3001

## Build (static export)

```bash
cd apps/storefront
# Ensure .env.local exists with:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_BASE_URL  (or CLOUDFLARE_R2_PUBLIC_BASE_URL)
npm run build
```

Output is in `out/`. Serve locally with e.g. `npx serve out`.

## Deploy to Cloudflare Pages

1. **Workers & Pages** → **Create** → **Pages** → **Connect to Git** (this repo).
2. **Build settings:**
   - **Root directory:** `apps/storefront`
   - **Framework preset:** None
   - **Build command:** `npm ci && npm run build`
   - **Build output directory:** `out`
3. **Environment variables** (Build time):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_BASE_URL` (or `CLOUDFLARE_R2_PUBLIC_BASE_URL`)
4. Save and deploy.

Admin and API stay on your main app (e.g. Vercel); this deploy is storefront-only.
