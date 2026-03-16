# Static Storefront Migration Plan

**Scope:** Public storefront only. No admin CRUD or upload flow changes.

**Goal:** Make the public storefront static-first so it does not depend on Next runtime; suitable for Cloudflare Pages.

---

## 1. Files Inspected

| File | Purpose |
|------|--------|
| `src/app/(store)/layout.tsx` | Store layout; no async, no fetch. |
| `src/app/(store)/page.tsx` | Homepage; **async** Server Component, fetches from `lib/data/sarees` + `lib/data/site-settings`. |
| `src/app/(store)/StorefrontHomePage.tsx` | Client component; uses initial props, lazy HomePreviewBridge. |
| `src/app/(store)/HomePreviewBridge.tsx` | Client; calls `getPreviewModeStatus`, `loadProductsForPreview` (Server Actions) only when mounted. |
| `src/app/(store)/kanchipuram-silks/page.tsx` | **Async** Server Component; fetches `listSarees()`. |
| `src/app/(store)/kanchipuram-silks/StorefrontListingPage.tsx` | Client; initial data + preview Server Actions when mounted. |
| `src/app/(store)/kanchipuram-silks/KanchipuramSilksClient.tsx` | Client; presentational. |
| `src/app/(store)/saree/[slug]/page.tsx` | **Async** Server Component; fetches `getSareeBySlug`, `store_settings`, `getProductSpecsForDisplay`. Uses `generateMetadata`. |
| `src/app/(store)/saree/[slug]/StorefrontDetailPage.tsx` | Client; initial data + preview Server Actions when mounted. |
| `src/app/(store)/login/page.tsx` | Server Component; **`redirect()`** on every request (runtime). |
| `src/app/(store)/information/page.tsx` | Pure static; no async, no fetch. |
| `src/middleware.ts` | Runs for **all** routes (matcher excludes only `_next/static`, `_next/image`, favicon, api, image files). For non-admin paths only adds `x-pathname` and returns next. |
| `src/modules/auth/auth.service.ts` | `isAdminRoute(pathname)` → `pathname.startsWith("/admin")`. Store paths are not admin. |
| `src/lib/data/sarees.ts` | Facade → `storefront.service` → `storefront.repository` (Supabase server client). |
| `src/lib/data/site-settings.ts` | `createClient()` (server) → Supabase. |
| `src/modules/storefront/storefront.service.ts` | Server-side only; uses repository + `getPublicImageUrl`. |
| `next.config.mjs` | No `output: 'export'`. |

---

## 2. Runtime Blockers (Public Storefront)

| Blocker | Where | Why it forces runtime |
|---------|--------|------------------------|
| **Middleware** | `middleware.ts` | Matcher runs on all HTML/document requests. Every storefront request (/, /kanchipuram-silks, /saree/..., /login, /information) invokes middleware before the response. On CF Pages / Vercel this is Edge/Node runtime. |
| **Async Server Components** | `(store)/page.tsx`, `(store)/kanchipuram-silks/page.tsx`, `(store)/saree/[slug]/page.tsx` | Fetch from Supabase at request time (or on first request with revalidate 3600). No `generateStaticParams` for `[slug]`, so detail pages are dynamic. |
| **Server-side redirect** | `(store)/login/page.tsx` | `redirect("/admin/login")` runs on the server for every request to `/login`. |
| **Store settings / specs on detail** | `saree/[slug]/page.tsx` | `createClient()` and `getProductSpecsForDisplay` run on server. |

**Not blockers for initial static HTML:** Client-only preview flows (`getPreviewModeStatus`, `loadProductsForPreview`, etc.) run in the browser after hydration; they do not block static generation of the first paint.

---

## 3. First Migration Step (Only)

**Step 1: Exclude public storefront paths from the middleware matcher.**

- **Change:** Update `middleware.ts` `config.matcher` so middleware does **not** run for:
  - `/`
  - `/kanchipuram-silks`
  - `/saree/*`
  - `/information`
  - `/login`
- **Result:** Requests to these URLs are no longer dependent on middleware runtime. Cached or static responses can be served without invoking middleware. Admin routes (`/admin`, `/admin/*`) continue to use middleware for auth.
- **Risk:** Low. Storefront does not use `x-pathname` or any middleware behavior today.

---

## 4. Manual Test Checklist (After Step 1)

- [ ] **Homepage** – Open `/`. Page loads; carousel and product grid show (live data or cached).
- [ ] **Listing** – Open `/kanchipuram-silks`. Product list and layout correct.
- [ ] **Detail** – Open `/saree/<slug>` for an existing product. Product details, images (R2), specs, WhatsApp/Call buttons correct.
- [ ] **Information** – Open `/information`. Static content and layout correct.
- [ ] **Login redirect** – Open `/login`. Redirects to `/admin/login`.
- [ ] **Admin protection** – Open `/admin` while logged out. Redirects to `/admin/login`. Open `/admin` while logged in as admin. Dashboard (or intended page) loads.
- [ ] **Preview (optional)** – As admin, enable preview on storefront; homepage/listing/detail show draft data where expected.
