# Deploy Only the Storefront to Cloudflare

Two ways to get the storefront on Cloudflare:

- **Option A – Static storefront only** → Cloudflare Pages serves pure static HTML/JS/CSS (zero runtime). Admin and upload API stay on another host (e.g. Vercel).
- **Option B – Full app on Cloudflare** → Whole Next.js app runs on Cloudflare (Pages + Workers). Storefront is static/cached; admin and API run as Workers.

---

## Option A: Static storefront only (recommended for “only storefront on Cloudflare”)

You build a **static export** of the storefront and deploy that to Cloudflare Pages. No Node/Edge for the storefront.

### 1. Add a storefront-only static export

In this repo, use a **separate build** that only contains storefront routes and uses `output: 'export'` so the result is a static folder.

**Option A1 – Same app, export and copy only storefront (manual)**

1. Enable static export and build:

```bash
# In next.config.mjs temporarily set:
# output: 'export',
```

But: with `output: 'export'`, Next will try to export every route. Admin routes use server auth and will break export. So this only works if you **temporarily remove or stub** admin/API routes for this build (e.g. a dedicated branch or script that excludes them).

**Option A2 – Dedicated storefront app in the repo (implemented)**

A dedicated app lives at `apps/storefront/`:

- Own `next.config.mjs` with `output: 'export'`
- Pages: `app/page.tsx` (home), `app/kanchipuram-silks/page.tsx`, `app/saree/[slug]/page.tsx`, `app/information/page.tsx`
- Reuses the existing `src/storefront` module (path alias `storefront`); data is fetched from Supabase at build time
- Build: `cd apps/storefront && npm run build` → output in `apps/storefront/out`

See `apps/storefront/README.md` for local dev and Cloudflare Pages deploy steps.

### 2. Create the project on Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Pick this repo (and the branch you use for the storefront build).
3. Configure the build:
   - **Framework preset:** None (or Next.js if you use Option B).
   - **Build command:**  
     - If using Option A2: `cd apps/storefront && npm ci && npm run build`  
     - Or your script that produces the static storefront (e.g. `npm run build:storefront` if you add it).
   - **Build output directory:** `out` (for Next.js static export it’s `out`; if your script puts files elsewhere, use that path, e.g. `apps/storefront/out`).
4. **Root directory (optional):** If the storefront app lives in a subdirectory (e.g. `apps/storefront`), set **Root directory** to that path so the build runs from there.
5. Add **Environment variables** (Build time):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_BASE_URL` (or `CLOUDFLARE_R2_PUBLIC_BASE_URL`) for image URLs

Then save and deploy. Cloudflare will build and deploy only the static output; no server/API for the storefront.

### 3. Where admin and API run

With Option A, the **storefront** is only static files on Cloudflare. Admin and the upload-sign API are **not** part of this deployment. You run them elsewhere, e.g.:

- Same repo on **Vercel** (no `output: 'export'`) for the full Next app (admin + `/api/upload-sign`), or
- A separate “admin” deployment.

Storefront and admin can share the same Supabase and R2; only the hosting is split.

---

## Option B: Full Next.js app on Cloudflare (storefront + admin + API)

Here you deploy the **entire** Next.js app to Cloudflare. The storefront is still static/cached; admin and API run on Cloudflare Workers.

1. Use Cloudflare’s Next.js support:
   - [Cloudflare Pages with Next.js](https://developers.cloudflare.com/pages/framework-guides/nextjs/) (or **@cloudflare/next-on-pages** if you’re on an older setup).
2. In the dashboard:
   - **Build command:** `npm run build` (or `npx @cloudflare/next-on-pages` if required by the guide).
   - **Build output directory:** as in the Cloudflare Next.js docs (often `.vercel/output` or similar when using their adapter).
3. Set the same env vars (Supabase, R2 public base URL) in the Cloudflare project.
4. Deploy. Storefront routes are served as static/cached; admin and `/api/upload-sign` run as Workers.

This is “deploy the whole app to Cloudflare,” not “only storefront,” but you only have one deployment and the storefront is still static-first.

---

## Quick comparison

|                         | Option A (static storefront only) | Option B (full app on Cloudflare) |
|-------------------------|------------------------------------|------------------------------------|
| What’s on Cloudflare   | Only static storefront             | Full Next app (storefront + admin + API) |
| Storefront runtime cost | None                               | None (static)                      |
| Admin / API             | Different host (e.g. Vercel)       | Same host (Workers)                |
| Setup                   | Extra storefront-only app or build | Single app + Cloudflare Next guide |

For “deploy **only** storefront in Cloudflare,” use **Option A** and point Cloudflare Pages at the static export (e.g. `out` or `apps/storefront/out`). For one deployment that includes admin and API on Cloudflare, use **Option B**.
