# Static Storefront Layer

**Purpose:** New storefront module for static generation (Cloudflare Pages). No dependency on admin, middleware, server actions, or runtime API routes.

---

## Folder structure

```
apps/storefront/src/
├── index.ts                    # Public exports used by app routes
├── data/
│   ├── supabase.client.ts      # Cookie-less Supabase client (build-time safe)
│   ├── storefront.service.ts   # Storefront queries and mappers
│   └── product-image.ts        # Public image URL helpers
├── domain/
│   ├── types/
│   │   └── storefront.types.ts # Product, ProductImage, ProductRow, SiteSettings, StoreSettings
│   └── utils/
│       ├── format-price.ts
│       └── stock.ts
└── ui/
    ├── components/
    ├── pages/
    └── shell/
```

**App routes (use storefront layer):**

- `src/app/(store)/page.tsx` → `HomePage` + storefront service
- `src/app/(store)/kanchipuram-silks/page.tsx` → `ProductListPage` + `getApprovedProducts`
- `src/app/(store)/saree/[slug]/page.tsx` → `ProductDetailPage` + `getApprovedProductBySlug`, `generateStaticParams` from `getApprovedProductSlugs()`

---

## Files created

| File | Purpose |
|------|--------|
| `apps/storefront/src/domain/types/storefront.types.ts` | Product, ProductImage, ProductRow, SiteSettings, StoreSettings |
| `apps/storefront/src/data/supabase.client.ts` | `createStorefrontSupabaseClient()` – no cookies, build-time safe |
| `apps/storefront/src/data/storefront.service.ts` | `getApprovedProducts`, `getApprovedProductSlugs`, `getApprovedProductBySlug`, `getFeaturedProducts`, `getCarouselImageUrls`, `getSiteSettings`, `getStoreSettings`, `getProductSpecsForDisplay`, `getPublicImageUrl` |
| `apps/storefront/src/data/product-image.ts` | Product image URL selection and fallback rules |
| `apps/storefront/src/ui/components/ProductCard.tsx` | Card with image (R2 URL), title, price, link to detail |
| `apps/storefront/src/ui/components/ProductGrid.tsx` | Grid of ProductCards |
| `apps/storefront/src/ui/components/Carousel.tsx` | Client carousel for homepage (imageUrls, rotationSeconds) |
| `apps/storefront/src/ui/components/ProductGallery.tsx` | Client gallery (main image + thumbnails) |
| `apps/storefront/src/ui/pages/HomePage.tsx` | Carousel + featured ProductGrid |
| `apps/storefront/src/ui/pages/ProductListPage.tsx` | ProductGrid of all approved products |
| `apps/storefront/src/ui/pages/ProductDetailPage.tsx` | Gallery, title, price, description, specs, WhatsApp/Call |
| `apps/storefront/src/index.ts` | Exports for app routes |
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
