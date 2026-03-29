# Storefront (`apps/storefront`)

Static Next.js app for the public customer-facing site: home, collection, product detail, information.

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Dev server on **port 3001** |
| `npm run build` | Static export → `out/` |
| `npm run start` | Serve production build (port 3001) |
| `npm run lint` | ESLint |

## Environment variables

Create `.env.local` in **this folder** (`apps/storefront/.env.local`).

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (read-only data at build time) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_BASE_URL` or `CLOUDFLARE_R2_PUBLIC_BASE_URL` | Yes* | Public base URL for product images (R2) |

\*Build fails to show images if missing; URLs are resolved in `src/data/storefront.service.ts`.

Optional: `NEXT_PUBLIC_SITE_URL` for absolute links in client-only code (e.g. WhatsApp share).

## Architecture

- **App routes:** `app/` for Next.js routes and metadata.
- **UI layer:** `src/ui/` for shell, reusable components, and page assemblies.
- **Domain layer:** `src/domain/` for business types and domain utilities.
- **Data layer:** `src/data/` for Supabase access and media helpers.
- **Output:** `output: "export"` in `next.config.mjs` → static HTML in `out/`.

## Documentation (in this app)

All storefront-specific docs live under **`docs/`** in this folder:

| File | Contents |
|------|----------|
| [docs/DEPLOY_STOREFRONT_CLOUDFLARE.md](./docs/DEPLOY_STOREFRONT_CLOUDFLARE.md) | Deploy static export to Cloudflare Pages |
| [docs/STOREFRONT_LAYER.md](./docs/STOREFRONT_LAYER.md) | `apps/storefront/src` structure and behaviour |
| [docs/STOREFRONT_UX_RECOMMENDATIONS.md](./docs/STOREFRONT_UX_RECOMMENDATIONS.md) | UX wireframes and recommendations |

Repo-level `docs/` may contain older copies; the **canonical** storefront docs are here.

## Related apps

- **Admin:** `apps/admin` — product management (not part of this build).
- **Upload signer:** `apps/upload-signer` — R2 presign worker (admin only; not used by storefront).
