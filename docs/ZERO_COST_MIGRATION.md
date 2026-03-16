# Zero-Cost Migration Analysis

**Purpose:** Assess what it would take to move from the current near-zero-cost Next.js setup to a true static-first, zero app-runtime architecture. For LLM or human review.

**Current stack:** Next.js 14, Supabase Auth, Supabase Postgres, Cloudflare R2, direct R2 image delivery.

**Goal:** Static storefront, browser-side auth where possible, minimal or no app runtime, only domain cost if possible.

---

## 1. What Currently Blocks True Zero-Cost

| Component | Why it has runtime cost |
|-----------|--------------------------|
| **Middleware** | Runs on every request (or every matching request). Even when the page is cached, the platform may still invoke the runtime to run middleware, then serve cache. |
| **Server Components** | First request and each revalidation run code on the server (Supabase client, DB reads). Without a server, they can't run. |
| **Server Actions** | All mutations (auth, product CRUD, draft images, settings, cleanup, preview cookie) execute on the server. |
| **`POST /api/upload-sign`** | Requires a Node/serverless environment with R2 credentials to generate presigned URLs. |
| **Auth checks in layout** | Admin layout uses `getSession()` on the server; that's server-side work on every admin request. |

**Summary:** True zero-cost is blocked by any request that triggers middleware, server rendering, server actions, or the upload-sign API. To be "only domain cost," the storefront must be **pure static** (no middleware, no server components, no server actions, no API), and any remaining runtime (e.g. admin + presigning) must be minimal and only when used.

---

## 2. What Needs Redesign

### Storefront

- **Option A – Static at build time:** Fetch products from Supabase at **build time** (SSG). No server on request. Updates require a rebuild or a revalidation trigger (webhook/cron calling your host's revalidate API, if you keep a tiny Next app for that).
- **Option B – Client-side data:** Storefront is static HTML/JS; the browser fetches products with the Supabase client (anon key). You rely on **RLS** so only approved products are visible. No server, but CSR and weaker SEO unless you add prerendering.

### Auth

- **Today:** Server session (cookies) + middleware + server `getSession()` in admin layout.
- **Redesign:** Auth only in the browser (Supabase client: `signInWithPassword`, `getSession`). No middleware for route "protection"; admin protection = client-side: "if no session or not admin, redirect to login." Real security is in **Supabase RLS** (and optionally `profiles.role`) so that even without middleware, only admins can mutate.

### Mutations

- **Today:** Server Actions call Supabase (and handle cleanup, etc.) on the server.
- **Redesign:** Browser calls Supabase directly (insert/update/delete) with RLS enforcing who can do what. Anything that needs **secrets** (e.g. presigning) moves out of Next to an edge/serverless function.

### Upload signing

- **Today:** Next.js API route with R2 credentials.
- **Redesign:** Presigned URL from something that isn't your Next server, e.g.:
  - **Supabase Edge Function** (Deno) that has R2 credentials (env) and returns a presigned URL, or
  - **Cloudflare Worker** with R2 bindings (native presign), no Next involved.

### Temp cleanup

- **Today:** Server Action calling Supabase + R2.
- **Redesign:** e.g. a **scheduled job** (Supabase Edge cron, or Cloudflare Worker cron, or external cron) that deletes abandoned temp objects; or a small serverless endpoint called by cron only, not by the browser.

### Middleware

- For a **static storefront**, you want **no middleware** on static routes so the host can serve pure static files (CDN-only). So either remove middleware and protect admin only client-side + RLS, or split hosting so the storefront is a different app/site with no middleware.

---

## 3. Smallest Migration Path

Rough order of steps with minimal change:

1. **Static storefront (no server on read path)**  
   Use **SSG**: at build time, fetch products from Supabase and generate static pages for `/`, `/kanchipuram-silks`, `/saree/[slug]`. Ensure **no middleware** runs for these routes (e.g. exclude `/`, `/kanchipuram-silks`, `/saree` from middleware so they're served as static). Revalidation: either "rebuild on schedule" or "on-demand revalidate" via a single serverless route or webhook that calls Next's revalidate API (so you keep one minimal serverless hit only when content changes).

2. **Client-only auth for admin**  
   Remove middleware (or restrict it to paths you still need). In admin layout/pages, use **client-side** `getSession()`; if no user or not admin, redirect to login. Rely on **RLS** so only admins can read/write admin data. No server-side session check.

3. **Replace Server Actions with client Supabase calls**  
   Admin: login, logout, product CRUD, settings, etc. → call Supabase from the browser with RLS. Keep only what **must** run with secrets: presigning (and optionally a dedicated cleanup endpoint for cron).

4. **Move presigning off Next.js**  
   Implement a **Supabase Edge Function** or **Cloudflare Worker** that returns a presigned R2 URL; admin upload flow calls that instead of `POST /api/upload-sign`. Then remove the Next.js API route.

5. **Optional: full static export**  
   Use `output: 'export'` for the storefront app and host it on Cloudflare Pages / R2 / any static host. If you still need "revalidate" or admin, keep a **tiny** serverless app (e.g. Vercel) only for: admin app and/or revalidate webhook and/or cron-triggered cleanup. Storefront = 100% static, zero app runtime.

---

## 4. Is It Worth Doing Now?

- **Worth it if:** You're on a plan where **per-invocation or runtime cost** matters (e.g. moving off Vercel to "only domain + static"), or you want the storefront to be **hosted on Cloudflare Pages** (or similar) with literally zero app server.
- **Probably not urgent if:** You're on a generous free tier (e.g. Vercel) and traffic is low (so you're already "near-zero" cost), or you prefer a **single Next.js app** and simple mental model over splitting storefront vs admin and adding Edge/Worker.

**Bottom line:** It's feasible and the migration path is small, but **worth it mainly when cost or hosting target (e.g. "static-only CDN") is a concrete goal**.

---

## 5. Recommended Hybrid Architecture

A practical "static-first, minimal runtime" setup:

| Layer | Approach |
|-------|----------|
| **Storefront** | **Fully static:** SSG at build time (Supabase fetch in `generateStaticParams` / build-time data), or client fetch + RLS if you accept CSR. Served from CDN (e.g. Cloudflare Pages, or Vercel's static layer) with **no middleware** and **no server components** on request. Images: keep **direct R2** (no change). |
| **Admin** | **Single Next.js app** (or minimal SPA) on a **small serverless** footprint: **client-side auth only** (Supabase in browser); no middleware. **Client → Supabase** for all mutations (RLS for admin-only). **Presigned upload:** one **Supabase Edge Function** or **Cloudflare Worker** (with R2 credentials) that returns the presigned URL; admin UI calls that instead of Next.js `/api/upload-sign`. So: "admin" runs only when an admin is using the app; no cost when no one is in admin. |
| **Revalidation (if SSG)** | **On-demand** – when you publish/update in admin, client (or a small serverless webhook) calls Next's revalidate API so the next request regenerates static pages. Or **cron** – scheduled job hits revalidate on a timer. Or **rebuild** – CI rebuilds and deploys the static storefront on content change (no Next server at all for storefront). |
| **Temp cleanup** | **Cron-triggered** Supabase Edge Function or Cloudflare Worker (or a single serverless route called only by cron), not by the browser. No Server Action. |

**Result:**

- **Storefront:** Static assets only → **zero app runtime**, only domain + static hosting cost.
- **Admin + presigning + optional revalidate:** Minimal serverless/edge, only when admins use the app or when you revalidate/cleanup.

---

## Current vs Target (Summary)

| Aspect | Current | True zero-cost storefront target |
|--------|---------|----------------------------------|
| Storefront pages | Server Components + revalidate 3600 | SSG or client fetch; no server on read |
| Middleware | Runs for /admin (and possibly all) | None for storefront; optional for admin |
| Auth | Server session + middleware + layout | Client-only; RLS for data |
| Mutations | Server Actions | Client → Supabase (RLS) |
| Upload sign | Next.js `/api/upload-sign` | Edge Function or Worker |
| Cleanup | Server Action | Cron + Edge/Worker or serverless |
| Hosting | Single Next.js app | Static storefront (CDN) + minimal serverless for admin/presign |
