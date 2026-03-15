-- Product images: alt_text, is_primary, show_on_homepage
-- Products: show_on_homepage
-- (Keep existing url column as storage_key; do not remove.)

ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS alt_text TEXT,
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN NOT NULL DEFAULT FALSE;

-- Ensure only one primary per product (application also enforces; partial unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_one_primary_per_product
  ON public.product_images (product_id)
  WHERE is_primary = TRUE;

-- Column comment is set in 20250227000002 after url → storage_key rename.
