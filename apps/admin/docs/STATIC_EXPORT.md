# Fully static admin (optional / advanced)

> **Update:** The admin app uses **`output: "export"`**. Deploy to Cloudflare Pages from GitHub: **[DEPLOY_CLOUDFLARE_PAGES.md](./DEPLOY_CLOUDFLARE_PAGES.md)**.

Older drafts of this doc assumed the admin was **not** “only static HTML/JS”:

- **Server Components** (e.g. async `layout.tsx` with `getSession()`).
- **Server Actions** (`"use server"`) for login, products, drafts, etc.
- **Server-side R2** (credentials in env) for temp finalize, deletes, etc.

So it **requires a Node/server runtime** unless you migrate.

## If you truly need `output: 'export'` (pure static files)

You must:

1. **Auth & data** — Use only the **browser Supabase client** (JWT + RLS). No `cookies()` / server Supabase client.
2. **No Server Actions** — Replace with plain async functions that call `createClient()` from `@/lib/supabase/client`.
3. **R2 secrets never in the admin bundle** — Use the **upload-signer Worker** for:
   - `POST /sign-upload` (already)
   - `POST /finalize-temp` — copy `temp/…` → `{productId}/…`
   - `POST /delete-objects` — delete keys by path  
   See `apps/upload-signer/docs/DEPLOY_CLOUDFLARE.md`.
4. **Dynamic App Router URLs** — Next static export does **not** serve `/products/[id]/edit` for arbitrary IDs unless you pre-render every ID at build time. Typical fix: **`/products/edit?id=<uuid>`** (query string) + one static page that loads data on the client.
5. **Remove** all `revalidatePath` / server-only APIs.

This is a **large** refactor across most of `apps/admin`.

## Practical alternative (same GitHub → Cloudflare workflow)

If the goal is **“host on Cloudflare from GitHub”** without rewriting the app:

- Deploy **admin** on **Cloudflare Pages** with **Next.js** in **full** mode (see [Cloudflare Next.js guide](https://developers.cloudflare.com/pages/framework-guides/nextjs/)), **not** static export only.

You still push to GitHub; Cloudflare builds and runs Next with the features you already use (Server Actions, server components).

## Summary

| Goal | Approach |
|------|----------|
| **Pure static files** (no server) | Full client migration + Worker R2 ops + route changes (this doc). |
| **Easiest Cloudflare + GitHub** | Cloudflare Pages + Next (non-static), keep current architecture. |

The upload-signer additions (`/finalize-temp`, `/delete-objects`) exist so a **future** static admin can delete/finalize storage **without** R2 secrets in the browser.
