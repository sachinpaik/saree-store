# Deliverables: Admin Product Lifecycle & Approval

## SQL migrations

- **supabase/migrations/20250228000001_product_lifecycle_and_drafts.sql**
  - `products`: add `name`, `product_code` (unique), `status`, `submitted_at`, `approved_at`, `rejected_at`, `rejection_reason`, `is_discontinued`, `discontinued_at`, `discontinued_reason`; backfill; indexes.
  - `product_attribute_values`: FK to `attribute_definitions(key)` changed to `ON DELETE RESTRICT` (no hard delete of definitions when values exist).
  - `product_drafts`: new table for edit approval (product_id, status, draft_data_json, submitted_at, approved_at, rejected_at, rejection_reason, created_at, updated_at).

## Files changed / added

### New files

- **src/components/admin/ProductWorkflowActions.tsx** – Workflow UI: submit for approval, approve/reject (product and draft), discontinue/re-enable, delete permanently with confirmation.
- **supabase/migrations/20250228000001_product_lifecycle_and_drafts.sql**
- **DELIVERABLES_PRODUCT_LIFECYCLE.md** (this file)

### Modified files

- **src/app/actions/products.ts**
  - `createProduct`: sets `name`, `product_code`, `status: "draft"`.
  - New: `submitProductForApproval`, `approveProduct`, `rejectProduct`, `discontinueProduct`, `reEnableProduct`, `saveProductDraft`, `submitDraftForApproval`, `approveDraft`, `rejectDraft`, `deleteProductPermanently`.
- **src/app/actions/attribute-definitions.ts**
  - `deleteAttributeDefinition`: now returns error "Disable instead" (no DB delete).
- **src/components/admin/AttributeDefinitionsManager.tsx**
  - Delete button removed; Edit only (disable via Active toggle).
- **src/components/admin/ProductForm.tsx**
  - Accepts `status`, `inactiveDefinitions`; when product is approved, submit saves to draft via `saveProductDraft`; "Save draft" label when approved; optional "Show inactive attributes (read-only)" toggle and section.
- **src/components/admin/ProductImageManager.tsx**
  - Optimistic preview: `pendingPreviews` with `URL.createObjectURL`; show uploading placeholders; revoke object URLs on unmount/completion.
- **src/app/(admin)/admin/products/[id]/edit/page.tsx**
  - Fetches `status`, `is_discontinued`, `product_code`, `product_drafts`, all attribute definitions; passes to `ProductWorkflowActions` and `ProductForm`; `inactiveDefinitions` for toggle.
- **src/app/(admin)/admin/products/page.tsx**
  - Selects `status`, `is_discontinued`; table shows Status column and Discontinued.
- **src/app/(admin)/admin/products/new/page.tsx**
  - No change (ProductForm used as-is; create still returns id and redirects to edit).
- **src/lib/data/sarees.ts**
  - `fetchFromSupabase`: filter by `status = 'approved'` and `is_discontinued = false` (customer visibility).
- **src/lib/data/attribute-definitions.ts**
  - New: `getAllAttributeDefinitions()` for inactive (read-only) attributes on product edit.

## Customer visibility

- Only products with **status = 'approved'** and **is_discontinued = false** are returned by `listSarees`, `getSareeBySlug`, `listSareesForHomepage`, `getCarouselImageUrls`.
- Product detail page uses `getSareeBySlug`; discontinued or non-approved products are not in the list → **404**.

## TypeScript

- Strict types preserved; no `any`. Draft/product status and workflow types used in actions and components.

## Notes

- **Attribute definitions**: No hard delete; `deleteAttributeDefinition` returns an error. Disable via `is_active` in Edit. FK on `product_attribute_values` is `ON DELETE RESTRICT` so existing values are never dropped by definition delete.
- **Permanent delete**: Requires typing product code or "DELETE" in the modal; server deletes drafts, attribute values, images, product, and attempts storage `provider.delete(key)` for each image.
- **Draft apply**: `approveDraft` applies `draft_data_json.product` and `draft_data_json.attribute_values` to the live product; image array in draft is preserved in JSON but image apply (replace product_images) can be added later if needed.
