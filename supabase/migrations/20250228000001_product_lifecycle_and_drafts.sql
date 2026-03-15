-- =====================================================
-- PRODUCT LIFECYCLE & APPROVAL (portable; no RLS/auth)
-- =====================================================

-- A) products: add name, product_code, status, approval timestamps, discontinue
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS product_code TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS is_discontinued BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS discontinued_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS discontinued_reason TEXT;

-- Backfill name = title, product_code = sku or fallback
UPDATE public.products SET name = title WHERE name IS NULL;
UPDATE public.products SET product_code = COALESCE(NULLIF(trim(sku), ''), 'P-' || substring(id::text from 1 for 8)) WHERE product_code IS NULL;
ALTER TABLE public.products ALTER COLUMN name SET NOT NULL;
ALTER TABLE public.products ALTER COLUMN product_code SET NOT NULL;

-- Unique product_code and indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_product_code ON public.products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_is_discontinued ON public.products(is_discontinued) WHERE is_discontinued = FALSE;

-- Existing rows: treat as approved
UPDATE public.products SET status = 'approved' WHERE status = 'draft';
UPDATE public.products SET approved_at = COALESCE(updated_at, created_at) WHERE status = 'approved' AND approved_at IS NULL;

-- B) product_images: ensure created_at exists (already in initial schema)
-- No change needed.

-- C) attribute_definitions: ensure is_active, no delete (app-level); FK on values -> RESTRICT
-- Drop CASCADE FK and re-add RESTRICT so disabling never deletes values
ALTER TABLE public.product_attribute_values
  DROP CONSTRAINT IF EXISTS product_attribute_values_attribute_key_fkey;
ALTER TABLE public.product_attribute_values
  ADD CONSTRAINT product_attribute_values_attribute_key_fkey
  FOREIGN KEY (attribute_key) REFERENCES public.attribute_definitions(key) ON DELETE RESTRICT;

-- D) product_drafts (approval for edits to approved products)
CREATE TABLE IF NOT EXISTS public.product_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  draft_data_json TEXT NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_drafts_product_id ON public.product_drafts(product_id);
CREATE INDEX IF NOT EXISTS idx_product_drafts_status ON public.product_drafts(status);

CREATE TRIGGER product_drafts_updated_at
  BEFORE UPDATE ON public.product_drafts
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

COMMENT ON TABLE public.product_drafts IS 'Draft edits for approved products; applied to live product when approved.';
