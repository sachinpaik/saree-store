# Storefront — screen layouts

ASCII wireframes for **how each page is composed** in the browser. Spacing is approximate; see Tailwind classes in source for exact values.

**Global shell:** `Header` (sticky) → `main` (flex-1) → `Footer`. Page background is blush (`--background`); main content scrolls under the sticky header.

---

## 1. Header

**Desktop (md and up, `h-14`, `max-w-6xl` centered, `px-4`)**

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Business name]     Home    Kanchipuram Silks    Info     [WhatsApp] [Call] │
│      serif              ↑ active = bottom border + dark text               │
└────────────────────────────────────────────────────────────────────────────┘
```

**Mobile (default)**

```
┌──────────────────────────────────────────┐
│ [Business name]        [WhatsApp]   [≡]  │
└──────────────────────────────────────────┘
```

- **WhatsApp:** green pill; label “WhatsApp” hidden below `sm` (icon only).
- **Call:** hidden on small screens; appears in the **open** mobile menu below nav links.

**Mobile menu open (`md:hidden` panel below header)**

```
┌──────────────────────────────────────────┐
│ ... header row as above ...              │
├──────────────────────────────────────────┤
│ Home                                     │
│ Kanchipuram Silks                        │
│ Info                                     │
│ 📞 Call us                    (if number)  │
└──────────────────────────────────────────┘
```

---

## 2. Footer

**`max-w-6xl`, `px-4`, `py-12`, top border**

```
┌────────────────────────────────────────────────────────────────────────────┐
│  [Business name]                     (serif, larger)                       │
│  Premium Kanchipuram silks, direct from weavers.                           │
│  Retail & wholesale welcome.                                                 │
│                                                                              │
│  COLLECTIONS          QUICK LINKS           CONTACT                          │
│  ───────────          ───────────           ───────                          │
│  Kanchipuram Silks    Home                  📞 +91 ...                       │
│                       Information           💬 WhatsApp us                   │
│                       Bulk Enquiries *      📷 Instagram *                   │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│              © [year] [Business name]. All rights reserved.                │
└────────────────────────────────────────────────────────────────────────────┘
```

\*Shown when configured. **Bulk Enquiries** opens WhatsApp with a bulk-oriented message.

**Small screens:** three columns stack to a single column (grid `grid-cols-1 sm:grid-cols-3`).

---

## 3. Home (`/`)

**Hero:** full-bleed carousel section. Ratio **8:3** on mobile, **14:3** on `md+` (~half the height of the former 4:3 / 21:9 hero). Dots near the bottom edge; overlay card bottom-left, above the dots.

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [HEADER]                                                                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│                     FULL-BLEED IMAGE CAROUSEL                              │
│                                                                            │
│  ┌─────────────────────────────┐                                           │
│  │ PREMIUM COLLECTION (gold)   │                                           │
│  │ Kanchipuram Silks (serif)   │  ← frosted card, bottom-left              │
│  │ Direct from weavers...      │                                           │
│  │ [Browse Collection] [WA Us] │                                           │
│  └─────────────────────────────┘                                           │
│                                                                            │
│                     ● ━━━  ○  ○  ○  ○   ← slide indicators                │
└────────────────────────────────────────────────────────────────────────────┘
```

**Bulk strip** (only if WhatsApp number exists): surface background, bottom border, content `max-w-6xl`.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Bulk & Wholesale Enquiries                                                │
│  Ordering 10+ sarees? We offer trade pricing and fast dispatch.           │
│  (no button in strip — text only)                                          │
└────────────────────────────────────────────────────────────────────────────┘
```

**Empty carousel:** grey placeholder block, centered “No images”.

---

## 4. Collection listing (`/kanchipuram-silks`)

**`py-10 md:py-14`, content `max-w-6xl`, `px-4`**

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [HEADER]                                                                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Home / Kanchipuram Silks                    (breadcrumb, muted)         │
│                                                                            │
│  Kanchipuram Silks                          N sarees in this collection →  │
│  Pure and blended Kanchipuram...            (right on md+, count)          │
│                                                                            │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                                      │
│  │      │ │      │ │      │ │      │   grid: 2 cols (mobile)              │
│  │ img  │ │ img  │ │ img  │ │ img  │         3 (sm)                        │
│  │ 3:4  │ │      │ │      │ │      │         4 (md+)                       │
│  └──────┘ └──────┘ └──────┘ └──────┘                                      │
│  SKU: …   SKU: …                                                         │
│  Title    Title    Title    Title                                          │
│  (no price on card in current UI)                                          │
│                                                                            │
│  ... rows repeat ...                                                       │
│                                                                            │
│  (if zero products: single line “No products at the moment.”)              │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Product card (grid tile)

```
┌────────────────┐
│                │
│     image      │  rounded-sm, border, hover slight zoom
│    3 : 4       │
│                │
└────────────────┘
 SKU: KS-001      (11px muted, if sku present)
 Title line(s)    (max 2 lines, underline on hover — whole card is link)
```

---

## 6. Product detail (`/saree/[slug]`)

**`py-10 md:py-14`, `max-w-5xl`, `px-4`.** Two columns from `lg`: gallery left, copy right.

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [HEADER]                                                                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Home / Kanchipuram Silks / Product title…                                 │
│                                                                            │
│  ┌─────────────────────┐   Product title (serif, large)                     │
│  │                     │   SKU: …                                          │
│  │                     │                                                   │
│  │    main image       │   Description                                     │
│  │       3:4           │   (prose, muted)                                  │
│  │                     │                                                   │
│  └─────────────────────┘   Specifications                                  │
│  [th][th][th] scroll →     ┌──────────────┬──────────────┐                 │
│                            │ Fabric       │ Pure silk    │                 │
│                            ├──────────────┼──────────────┤                 │
│                            │ …            │ …            │                 │
│                            └──────────────┴──────────────┘                 │
│                                                                            │
│                            ┌──────────────────────────────────────────┐    │
│                            │  WhatsApp  – Enquire about this saree *   │    │
│                            └──────────────────────────────────────────┘    │
│                            * sublabel hidden on xs                         │
│                                                                            │
│  (no price block, no Call button in column — current UI)                    │
└────────────────────────────────────────────────────────────────────────────┘
```

**Mobile:** gallery stacks **above** copy (single column).

**Gallery:** no images → grey “No image” block.

---

## 7. Information (`/information`)

**Narrow reading column `max-w-3xl`, `py-10 md:py-14`, vertical `space-y-8`.**

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [HEADER]                                                                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Have a question about a saree?           (H1, serif)                      │
│  The easiest way to enquire is over WhatsApp...                            │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                     WhatsApp us (full width green)                  │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                            │
│  For a specific saree, open… Kanchipuram Silks … link …                    │
│                                                                            │
│  ┌─ WHOLESALE & BULK ENQUIRIES ─────────────────────────────────────┐      │
│  │  Body copy + bullet list (MOQ, lead time, payment)                 │      │
│  └────────────────────────────────────────────────────────────────────┘      │
│                                                                            │
│  ABOUT OUR SAREES    AUTHENTICITY        CARE                              │
│  ───────────────     ────────────        ────                              │
│  short para          short para          short para                        │
│  (1 col mobile, 3 col md+)                                                 │
│                                                                            │
│  CONTACT DETAILS                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ 📱 WhatsApp: …                                                      │    │
│  │ 📞 Phone: …                                                         │    │
│  │ ✉  Email: …                                                        │    │
│  │ 🕐 Hours: …                                                        │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Quick reference — max widths

| Region            | Constraint        |
|-------------------|-------------------|
| Header / footer   | `max-w-6xl`       |
| Home bulk strip   | `max-w-6xl`       |
| Listing           | `max-w-6xl`       |
| Product detail    | `max-w-5xl`       |
| Information       | `max-w-3xl`       |

---

## Source files

| Screen    | Primary files |
|-----------|----------------|
| Shell     | `app/layout.tsx`, `components/Header.tsx`, `HeaderInner.tsx`, `Footer.tsx` |
| Home      | `app/page.tsx`, `src/storefront/pages/HomePage.tsx`, `src/storefront/components/Carousel.tsx` |
| Listing   | `app/kanchipuram-silks/page.tsx`, `src/storefront/pages/ProductListPage.tsx`, `ProductGrid.tsx`, `ProductCard.tsx` |
| Detail    | `app/saree/[slug]/page.tsx`, `src/storefront/pages/ProductDetailPage.tsx`, `ProductGallery.tsx` |
| Info      | `app/information/page.tsx` |
