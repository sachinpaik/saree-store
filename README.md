# Saree Store

E-commerce storefront for a saree shop. Built with Next.js 14 (App Router), TypeScript, Supabase (Auth + Postgres), and Cloudflare R2 for images. Designed for low runtime cost: public storefront uses cached pages and direct R2 image URLs; uploads go browser → presigned URL → R2.

---

## For LLM / human review

- **Architecture:** See **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for current architecture, data flow, auth, API routes, and conventions. Use it to review or recommend changes.
- **Preview mode:** See **[docs/PREVIEW_MODE.md](docs/PREVIEW_MODE.md)** for admin draft preview behavior.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router), React 18 |
| Language | TypeScript |
| Auth | Supabase Auth (email/password, session in cookies) |
| Database | Supabase Postgres |
| Images | Cloudflare R2 (presigned PUT upload; direct public URLs for storefront) |
| Styling | Tailwind CSS |

---

## Project structure (summary)

```
src/
├── app/
│   ├── (store)/          # Public storefront (/, /kanchipuram-silks, /saree/[slug])
│   ├── (admin)/          # Admin panel (/admin/*)
│   ├── actions/          # Server Actions (auth, products, cleanup-temp, etc.)
│   └── api/              # upload-sign (presigned URL); optional media proxy
├── modules/              # Feature logic: auth, images, storefront
├── lib/                  # Shared: supabase clients, data facades, media-url, preview-data
├── components/           # UI: admin, auth, layout, saree, sections
└── middleware.ts         # Admin route protection
```

---

## Setup

### Prerequisites

- Node.js 18+
- Supabase project (Auth + Postgres)
- Cloudflare R2 bucket (and optional public URL for storefront images)

### 1. Install

```bash
npm install
```

### 2. Environment variables

Create `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Cloudflare R2 (upload + optional public URL for storefront images)
CLOUDFLARE_R2_ACCOUNT_ID=xxx
CLOUDFLARE_R2_ACCESS_KEY_ID=xxx
CLOUDFLARE_R2_SECRET_ACCESS_KEY=xxx
CLOUDFLARE_R2_BUCKET=your-bucket

# Required for public storefront image URLs (direct R2/CDN; no app proxy)
NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_BASE_URL=https://your-r2-public-url.r2.dev
```

### 3. Database

Run Supabase migrations in `supabase/migrations/` in order (see migrations folder). Ensure `profiles` exists and has `role` for admin users if using preview or RLS.

### 4. Run

```bash
npm run dev
```

- Storefront: http://localhost:3000  
- Admin: http://localhost:3000/admin  
- Login: http://localhost:3000/admin/login  

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Design principles (current)

- **Public storefront:** Cached/static-friendly pages; product data from Supabase; images from direct R2 URLs only (no `/api/media` for customers).
- **Uploads:** Browser gets presigned PUT URL from `/api/upload-sign`, then uploads file directly to R2.
- **Temp cleanup:** Via Server Actions (`cleanupTempUploadsByKeysAction`, `cleanupAbandonedTempUploadsAction`); no cleanup API route.
- **Admin:** Supabase Auth; middleware protects `/admin`; product CRUD and revalidation in Server Actions.

For full detail and conventions, see **docs/ARCHITECTURE.md**.
