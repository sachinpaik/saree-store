# Admin Draft Preview Mode

This document explains how the admin draft preview system works.

## Overview

The admin draft preview mode allows administrators to preview how draft changes will look on the actual customer-facing storefront pages, without creating separate preview routes.

## How It Works

### 1. Preview Mode Cookie

When an admin clicks "Open Preview" from the edit page:
- A secure HTTP-only cookie (`admin_preview_mode`) is set
- The cookie is only set if the user is verified as an admin
- The cookie expires after 24 hours

**File**: `src/app/actions/preview-mode.ts`
- `enablePreviewMode()`: Sets the preview cookie (admin only) - Returns error if not admin
- `disablePreviewMode()`: Removes the preview cookie
- `isPreviewModeEnabled()`: Checks if preview mode is active for current admin - **NEVER throws, returns false on any error**
- `getPreviewModeStatus()`: Returns both admin status and preview mode status - **NEVER throws**

**Critical Design**: All functions that are called from storefront pages use defensive error handling and return `false` rather than throwing errors. This ensures customer pages always work.

### 2. Draft-Aware Data Loading

When preview mode is enabled, storefront pages use special loaders that merge draft data with live data:

**File**: `src/lib/preview-data.ts`

**Functions**:
- `loadProductForPreview(productId)`: Loads a single product with draft data merged in - **NEVER throws**
- `loadProductsForPreview(filters)`: Loads multiple products with draft data merged in - **NEVER throws**

**Logic**:
1. If preview mode is OFF or user is not admin → return live data only
2. If preview mode is ON:
   - Load live product/products
   - Check if drafts exist for those products
   - Merge draft changes into product data:
     - Product fields (title, price, description, etc.)
     - Images (respecting `marked_for_deletion` and `is_draft_only` flags)
3. **On ANY error** (auth failure, DB error, invalid JSON, etc.):
   - Log error to console (for debugging)
   - Fall back to live data
   - Never throw, never block page render

### 3. Storefront Pages Support

The following storefront pages support preview mode:

**Product Detail Page**: `/saree/[slug]`
- File: `src/app/(store)/saree/[slug]/page.tsx`
- Shows draft-merged product data when preview mode is ON
- Shows preview bar at top for admins

**Homepage**: `/`
- Server: `src/app/(store)/page.tsx` (live data only; cache-friendly)
- Preview logic is lazy-loaded: `HomePreviewBridge` (dynamic import, no SSR) so public visitors do not load admin/preview code. When an admin has preview enabled, the bridge loads and merges draft data for carousel and grid.

**Collection Page**: `/kanchipuram-silks`
- File: `src/app/(store)/kanchipuram-silks/page.tsx`
- Shows draft-merged products in listing
- Search/filter works with draft data

### 4. Preview Bar

When in preview mode, a blue bar appears at the top of storefront pages:

**File**: `src/components/admin/PreviewBar.tsx`

**Features**:
- "Back to Edit" button → navigates back to product edit page
- "View Live" button → disables preview mode and refreshes to show live data
- "Exit Preview" button → disables preview mode and refreshes

### 5. Edit Page Integration

**File**: `src/components/admin/EditProductClientLayout.tsx`

The draft banner now includes an "Open Preview" button:
- Located in: `src/components/admin/OpenPreviewButton.tsx`
- Clicking it:
  1. Enables preview mode
  2. Navigates to the customer-facing product page
  3. Admin sees the page with draft changes merged in

## Security

### Critical Security & Resilience Design

The preview system is designed with **fail-safe defaults** to ensure customer-facing pages NEVER break:

**Authentication & Authorization:**
- Preview mode is only available to authenticated admins
- The `isAdmin()` function checks user role from the `profiles` table
- **IMPORTANT**: All auth checks return `false` on ANY error (never throw)
- Non-admin users always see live/approved data, even if the cookie is somehow set
- All checks happen server-side before rendering

**Fail-Safe Behavior:**

The system follows this strict priority:
1. **Preview mode OFF** → return live data
2. **Preview mode ON + user is admin** → return draft-aware data
3. **Preview mode ON + auth fails / user not admin** → silently fall back to live data (NO errors thrown)

**What This Means:**
- If preview cookie exists but user session expired → show live data
- If preview cookie exists but user lost admin role → show live data
- If database query fails during auth check → show live data
- If draft loading fails → show live product
- If draft JSON is invalid → show live product
- Customer-facing pages NEVER return "Unauthorized" or crash due to preview mode

**Where "Unauthorized" IS Returned:**
- Only on admin-specific endpoints (e.g., `enablePreviewMode()` action)
- Never on storefront routes like `/`, `/saree/[slug]`, `/kanchipuram-silks`

## Data Flow

### Normal User (Customer):
1. Request page → `isPreviewModeEnabled()` returns `false`
2. Page loads live data only
3. No preview bar shown

### Admin with Preview OFF:
1. Request page → `isPreviewModeEnabled()` returns `false`
2. Page loads live data only
3. No preview bar shown

### Admin with Preview ON:
1. Admin clicks "Open Preview" on edit page
2. Preview mode cookie is set
3. Request page → `isPreviewModeEnabled()` returns `true`
4. Page uses `loadProductForPreview()` or `loadProductsForPreview()`
5. Draft data is merged with live data
6. Preview bar is shown at top
7. Admin sees what customers will see after draft approval

### Admin with Preview ON but Session Expired:
1. Preview cookie exists in browser
2. Request page → `isAdmin()` check fails (no valid session)
3. `isPreviewModeEnabled()` returns `false` (admin check failed)
4. Page loads live data (same as normal customer)
5. No preview bar shown
6. Admin sees live data (same as customers)
7. **NO ERROR THROWN** - page works normally

## Draft Data Merging Logic

When merging draft data:

**Product Fields**:
- Draft fields override live fields
- Example: If draft has `title: "New Title"`, it replaces the live title

**Images**:
- Images with `marked_for_deletion: true` are filtered out
- Images with `is_draft_only: true` are included (these are new uploads)
- Images without these flags are existing live images
- Sort order from draft is respected

## Example Workflow

1. Admin edits product → uploads new image, changes title
2. Draft is saved with:
   - `product: { title: "New Title" }`
   - `images: [...existing images, { storage_key: "new.jpg", is_draft_only: true }]`
3. Admin clicks "Open Preview"
4. Preview mode enabled → navigates to `/saree/product-slug`
5. Product page loads → checks preview mode → loads draft
6. Page shows: "New Title" + all images including "new.jpg"
7. Admin sees preview bar at top
8. Customer visiting same page sees old title + old images (no new.jpg)
9. Admin clicks "Back to Edit" → returns to edit page
10. Admin approves draft → draft data becomes live
11. Now customers see "New Title" + new image

## Files Changed

### New Files:
- `src/app/actions/preview-mode.ts` - Preview mode cookie management
- `src/lib/preview-data.ts` - Draft-aware data loaders
- `src/components/admin/PreviewBar.tsx` - Preview bar UI
- `src/components/admin/OpenPreviewButton.tsx` - Button to enable preview

### Modified Files:
- `src/app/(store)/saree/[slug]/page.tsx` - Product page with preview support
- `src/app/(store)/page.tsx` - Homepage with preview support
- `src/app/(store)/kanchipuram-silks/page.tsx` - Collection page with preview support
- `src/app/(store)/kanchipuram-silks/KanchipuramSilksClient.tsx` - Added preview mode margin
- `src/components/admin/EditProductClientLayout.tsx` - Added "Open Preview" button

## Notes

- Preview mode does NOT affect the data itself, only what the admin sees
- Customers always see approved data, regardless of preview mode
- Preview mode automatically expires after 24 hours
- Preview mode is session-based (per browser/device)
- Multiple admins can preview independently
- Preview mode works with existing draft system, no database changes needed
