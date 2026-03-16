# Static Storefront Layer

**Purpose:** New storefront module for static generation (Cloudflare Pages). No dependency on admin, middleware, server actions, or runtime API routes.

---

## Folder structure

```
src/storefront/
├── index.ts                    # Public exports (pages, service, types)
├── types/
│   └── storefront.types.ts     # Product, ProductImage, ProductRow, SiteSettings, StoreSettings
├── services/
│   ├── supabase.client.ts       # Cookie-less Supabase client (build-time safe)
│   └── storefront.service.ts    # getApprovedProducts, getApprovedProductSlugs, getApprovedProductBySlug, etc.
├── components/
│   ├── ProductCard.tsx
│   ├── ProductGrid.tsx
│   ├── Carousel.tsx
│   └── ProductGallery.tsx
└── pages/
    ├── HomePage.tsx             # Featured products + carousel
    ├── ProductListPage.tsx      # All approved products
    └── ProductDetailPage.tsx    # Product detail + gallery + specs + WhatsApp/Call
```

**App routes (use storefront layer):**

- `src/app/(store)/page.tsx` → `HomePage` + storefront service
- `src/app/(store)/kanchipuram-silks/page.tsx` → `ProductListPage` + `getApprovedProducts`
- `src/app/(store)/saree/[slug]/page.tsx` → `ProductDetailPage` + `getApprovedProductBySlug`, `generateStaticParams` from `getApprovedProductSlugs()`

---

## Files created

| File | Purpose |
|------|--------|
| `src/storefront/types/storefront.types.ts` | Product, ProductImage, ProductRow, SiteSettings, StoreSettings |
| `src/storefront/services/supabase.client.ts` | `createStorefrontSupabaseClient()` – no cookies, build-time safe |
| `src/storefront/services/storefront.service.ts` | `getApprovedProducts`, `getApprovedProductSlugs`, `getApprovedProductBySlug`, `getFeaturedProducts`, `getCarouselImageUrls`, `getSiteSettings`, `getStoreSettings`, `getProductSpecsForDisplay`, `getPublicImageUrl` |
| `src/storefront/components/ProductCard.tsx` | Card with image (R2 URL), title, price, link to detail |
| `src/storefront/components/ProductGrid.tsx` | Grid of ProductCards |
| `src/storefront/components/Carousel.tsx` | Client carousel for homepage (imageUrls, rotationSeconds) |
| `src/storefront/components/ProductGallery.tsx` | Client gallery (main image + thumbnails) |
| `src/storefront/pages/HomePage.tsx` | Carousel + featured ProductGrid |
| `src/storefront/pages/ProductListPage.tsx` | ProductGrid of all approved products |
| `src/storefront/pages/ProductDetailPage.tsx` | Gallery, title, price, description, specs, WhatsApp/Call |
| `src/storefront/index.ts` | Exports for app routes |
| `src/app/(store)/page.tsx` | Uses storefront only (force-static) |
| `src/app/(store)/kanchipuram-silks/page.tsx` | Uses storefront only (force-static) |
| `src/app/(store)/saree/[slug]/page.tsx` | Uses storefront only; `generateStaticParams`, `dynamicParams = false` |
| `src/middleware.ts` | Matcher changed to `["/admin", "/admin/(.*)"]` so storefront is not run through middleware |

---

## Behaviour

- **Data:** All storefront data is read via the cookie-less Supabase client in `storefront/services`, so pages can be generated at build time.
- **Images:** `getPublicImageUrl(storageKey)` builds direct R2 URLs from `NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_BASE_URL` (or `CLOUDFLARE_R2_PUBLIC_BASE_URL`). No API route for images.
- **Products:** Only `status = 'approved'` and `is_discontinued = false` are fetched.
- **Static params:** `getApprovedProductSlugs()` drives `generateStaticParams` for `/saree/[slug]`; `dynamicParams = false` so unknown slugs 404 without runtime.

---

## Manual test checklist

- [ ] **Homepage** – Open `/`. Carousel and featured product grid load. Images load from R2 (check network: direct R2/CDN URL).
- [ ] **Listing** – Open `/kanchipuram-silks`. All approved products listed. Links to detail work.
- [ ] **Detail** – Open `/saree/<slug>` for an approved product. Gallery, title, price, description, specs, WhatsApp/Call (if configured) correct.
- [ ] **Unknown slug** – Open `/saree/nonexistent-slug`. 404.
- [ ] **Build** – Run `npm run build`. Homepage, listing, and all `/saree/[slug]` for approved slugs are statically generated (no runtime errors).
- [ ] **Admin unchanged** – Log in at `/admin/login`, open `/admin`, products CRUD and upload still work.
