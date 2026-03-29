# Storefront UX — Current State & Roadmap

**Audience:** Retail shoppers and bulk buyers (boutiques, resellers, wholesalers)  
**Stack:** Next.js App Router, static export (`output: 'export'`), Supabase-backed build-time data  
**Core principle:** The saree is merchandised on the site; the sale completes on WhatsApp or phone. Every screen should surface a clear, low-friction path to contact.

**Last reviewed:** March 2025 (aligned with `apps/storefront` + `apps/storefront/src`)

---

## Table of contents

1. [Information architecture](#1-information-architecture)
2. [Design system](#2-design-system)
3. [Global chrome](#3-global-chrome-header--footer)
4. [Home](#4-home)
5. [Collection listing](#5-collection-listing-kanchipuram-silks)
6. [Product detail](#6-product-detail-sareeslug)
7. [Information](#7-information)
8. [Conversion & messaging](#8-conversion--messaging)
9. [Gap summary & priorities](#9-gap-summary--priorities)
10. [Data available without schema changes](#10-data-available-without-schema-changes)

---

## 1. Information architecture

| Route | Purpose | Data source |
|-------|---------|-------------|
| `/` | Hero carousel + bulk strip | Featured products (images only for carousel), `site_settings`, `store_settings` |
| `/kanchipuram-silks` | Full approved catalogue grid | `getApprovedProducts()` |
| `/saree/[slug]` | Single product story + WhatsApp CTA | `getApprovedProductBySlug`, specs, `store_settings` |
| `/information` | Trust, wholesale copy, contact | `site_settings`, `store_settings` |

Static params are generated for product slugs at build time (`generateStaticParams`).

---

## 2. Design system

**Typography**

- Body: Inter (`--font-sans`)
- Headings / logo: Lora (`--font-serif`)

**Colour tokens** (`globals.css` + Tailwind)

- **background** `#fdf4f7` — page canvas (blush)
- **foreground** `#221012` — primary text
- **surface** `#fff9fb` — header, footer, cards
- **muted** `#8a5b5b` — secondary text
- **rim** (border) `#f0d8df`
- **accentGold** — small labels (e.g. carousel kicker)
- **accentBerry** — primary in-carousel CTA (“Browse Collection”)
- **green-600/700** — WhatsApp actions (consistent with convention)

**Layout**

- Content max width: `max-w-6xl` (listing, home strip); product detail `max-w-5xl`
- Product grid: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4`

---

## 3. Global chrome (header + footer)

### Header — as implemented

- **Sticky** bar (`h-14`), blurred surface, bottom border
- **Brand:** `business_name` from `site_settings` (fallback “Saree Store”), serif, links home
- **Desktop nav:** Home, Kanchipuram Silks, Info — **active route** shown with bottom border + foreground colour
- **Actions:** WhatsApp pill (icon + “WhatsApp” from `sm` breakpoint); Call (md+); mobile **hamburger** with nav + Call
- Default WhatsApp prefill: *“Hi, I'd like to enquire about your saree collection.”*

### Footer — as implemented

- **Tagline:** “Premium Kanchipuram silks, direct from weavers.” + “Retail & wholesale welcome.”
- **Three columns:** Collections (links), Quick Links (Home, Information, **Bulk Enquiries** → WhatsApp with bulk-oriented message), Contact (tel, WhatsApp, Instagram when configured)
- **Copyright** with dynamic year and `business_name`

### UX notes

- Header and footer match earlier recommendations for compact chrome, persistent WhatsApp, and footer contact/social.
- **Future:** If more collections ship, extend `NAV_LINKS` and footer Collections list in parallel.

---

## 4. Home

### As implemented

- **Carousel** (`aspect-[4/3]` / `md:aspect-[21/9]`): rotates through image URLs derived from featured products; dot indicators; optional empty state.
- **Overlay card** (bottom-left): kicker “Premium Collection”, title “Kanchipuram Silks”, line “Direct from weavers. Retail & wholesale welcome.”, **Browse Collection** (berry) + **WhatsApp Us** (outline + icon).
- **Bulk strip** (surface band): headline “Bulk & Wholesale Enquiries” and supporting line; **only renders when a WhatsApp number exists**. There is **no dedicated button** in the strip (by design in code — users are pointed to other entry points).

### Gaps

- **`featuredProducts` is loaded in `app/page.tsx` but not rendered** as a product grid on the home page. Buyers landing on `/` see the carousel and bulk strip only — no “New arrivals / Featured” row unless they click into the collection.
- Bulk strip could add a single **WhatsApp (bulk)** CTA for parity with the overlay and footer.

---

## 5. Collection listing (`/kanchipuram-silks`)

### As implemented

- **Breadcrumb:** Home / Kanchipuram Silks
- **H1** + short positioning copy (boutiques, resellers, individual buyers)
- **Count:** “*N* saree(s) in this collection” when `N > 0`
- **Product grid** via `ProductGrid` → `ProductCard`

### Gaps

- **No sort or filter** (price, newest, availability).
- **Product cards omit price and stock** even though `price_inr`, `price_aed`, and `stock_status` exist on the `Product` type and are populated in `storefront.service`.

---

## 6. Product detail (`/saree/[slug]`)

### As implemented

- **Breadcrumb:** Home / Kanchipuram Silks / product title (truncated on small screens)
- **Gallery:** Main image + thumbnail strip; keyboard-friendly thumb `button`s
- **Title** + **SKU** (when present)
- **Description** (prose) and **Specifications** as a bordered `dl` with two-column rows
- **WhatsApp:** full-width green button; sublabel on `sm+`: “Enquire about this saree”
- Client builds `wa.me` link with **current page URL** as the message body (so the buyer sends the product link)

### Gaps

- **No visible INR/AED pricing** on the page.
- **No stock / urgency line** (`stock_status` not surfaced).
- **No Call button** on the detail column (header/footer still offer Call).
- **`whatsapp_message_template` from `store_settings` is passed from the server but the client link does not append the template text** — only the URL is sent. If product-specific copy is required, the link builder should combine template + URL (or template with `{title}` / `{sku}` placeholders).
- **No related products**, **no share** control on the gallery.
- **No “Back” link** (breadcrumb replaces a single back target; acceptable if breadcrumb stays visible).

---

## 7. Information

### As implemented

- **Enquiry hub** H1 + explainer; primary **WhatsApp us** when number configured; pointer to open a saree page for item-specific buttons
- **Wholesale & bulk** card: prose + bullets (MOQ ~10, lead time, payment)
- **Three short columns:** About selection, Authenticity, Care
- **Contact details** tile: WhatsApp number, phone, email (mailto), support hours (default copy if missing)

### Gaps

- **`whatsappBulkHref` is constructed in the page but not used** — bulk buyers rely on footer “Bulk Enquiries” or generic “WhatsApp us”. Adding a second button or linking the wholesale card to the bulk `wa.me` text would match intent.
- **No FAQ** accordion yet.

---

## 8. Conversion & messaging

**WhatsApp entry points today**

| Location | Prefill / behaviour |
|----------|---------------------|
| Header | Generic collection enquiry |
| Home carousel | Generic “enquire about collection” |
| Home bulk strip | (no link in strip) |
| Footer quick link “Bulk Enquiries” | Bulk / wholesale ask |
| Footer “WhatsApp us” | Generic |
| Information | “question about sarees” |
| Product detail | **Product page URL only** |

**Consistency opportunity:** Align detail-page messages with `whatsapp_message_template` (e.g. prepend “Interested in: {title} ({sku})” + newline + URL).

---

## 9. Gap summary & priorities

### Shipped since earlier UX doc (high level)

- Compact sticky header with active nav, WhatsApp, Call, mobile menu
- Carousel overlay with brand line + Browse + WhatsApp
- Footer tagline, columns, contact, Instagram, bulk link
- Listing breadcrumbs, count, stronger description
- Detail breadcrumbs, SKU, structured specs, prominent WhatsApp
- Information page with real contact fields and wholesale copy

### Highest impact remaining

| Priority | Item | Rationale |
|----------|------|-----------|
| P0 | Show **price (INR primary, AED secondary)** on cards and PDP | Buyers cannot evaluate or compare without opening admin or asking on WhatsApp |
| P0 | Show **stock_status** on cards and PDP (badge + out-of-stock treatment) | Data exists; reduces pointless enquiries |
| P1 | Render **featured / new arrivals grid** on home (data already fetched) | Uses existing `featuredProducts`; shortens path to products |
| P1 | **Bulk WhatsApp CTA** on home strip and/or Information wholesale card | Completes the bulk funnel without scrolling to footer |
| P1 | Use **`whatsapp_message_template` + URL** on product detail | Matches admin configuration and B2B expectations |
| P2 | **Call** on product detail as secondary CTA | Same pattern as header |
| P2 | **Sort** on listing (price, newest) | Helps as catalogue grows |
| P2 | **FAQ** on Information | Reduces repeated WhatsApp questions |
| P3 | **Related products** on PDP | Reduces dead ends |
| P3 | **Share** on gallery | Partner / stylist forwards link |

---

## 10. Data available without schema changes

| UX need | Source |
|---------|--------|
| WhatsApp / Call | `store_settings.whatsapp_number`, `call_number` |
| WhatsApp template | `store_settings.whatsapp_message_template` (`{title}`, `{sku}`) |
| Business name | `site_settings.business_name` |
| Contact display | `contact_email`, `support_hours`, `instagram_url` (and store numbers) |
| Carousel timing | `site_settings.homepage_rotation_seconds` |
| Price | `product.price_inr`, `product.price_aed` |
| Stock | `product.stock_status` (`in_stock` / `low_stock` / `out_of_stock`) |
| SKU | `product.sku` |

**Net-new copy** (optional): FAQ answers, longer brand story — can remain static in `information/page.tsx` or move to `site_settings` later.

---

**Per-page wireframes:** See [STOREFRONT_SCREEN_LAYOUTS.md](./STOREFRONT_SCREEN_LAYOUTS.md) for ASCII layouts of header, footer, home, listing, card, detail, and information.

---

## Appendix — Key files (for implementers)

| Area | Path |
|------|------|
| Layout shell | `apps/storefront/app/layout.tsx` |
| Home route | `apps/storefront/app/page.tsx` |
| Home UI | `apps/storefront/src/ui/pages/HomePage.tsx` |
| Header client | `apps/storefront/src/ui/shell/HeaderInner.tsx` |
| Footer | `apps/storefront/src/ui/shell/Footer.tsx` |
| Listing | `apps/storefront/src/ui/pages/ProductListPage.tsx` |
| Card | `apps/storefront/src/ui/components/ProductCard.tsx` |
| Detail | `apps/storefront/src/ui/pages/ProductDetailPage.tsx` |
| Information | `apps/storefront/app/information/page.tsx` |
| Tokens | `apps/storefront/app/globals.css`, `apps/storefront/tailwind.config.ts` |
