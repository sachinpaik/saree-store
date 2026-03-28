-- =====================================================
-- Product image variants for storefront optimization
-- Migration-safe: keep legacy columns and allow gradual backfill.
-- =====================================================

ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS original_url TEXT,
  ADD COLUMN IF NOT EXISTS thumb_url TEXT,
  ADD COLUMN IF NOT EXISTS medium_url TEXT,
  ADD COLUMN IF NOT EXISTS large_url TEXT,
  ADD COLUMN IF NOT EXISTS image_tag TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ready',
  ADD COLUMN IF NOT EXISTS width INT,
  ADD COLUMN IF NOT EXISTS height INT,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'product_images_status_check'
  ) THEN
    ALTER TABLE public.product_images
      ADD CONSTRAINT product_images_status_check
      CHECK (status IN ('uploading', 'processing', 'ready', 'failed'));
  END IF;
END $$;

-- Backfill existing rows to keep old products working without app-side assumptions.
UPDATE public.product_images
SET
  original_url = COALESCE(original_url, storage_key),
  medium_url = COALESCE(medium_url, storage_key),
  thumb_url = COALESCE(thumb_url, storage_key),
  large_url = COALESCE(large_url, storage_key),
  image_url = COALESCE(image_url, storage_key),
  status = COALESCE(status, 'ready')
WHERE storage_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_images_status
  ON public.product_images(status);

COMMENT ON COLUMN public.product_images.image_url IS
  'Legacy single-image fallback. Keep during gradual migration.';
COMMENT ON COLUMN public.product_images.thumb_url IS
  'Small image for cards/listing/related.';
COMMENT ON COLUMN public.product_images.medium_url IS
  'Main image for PDP.';
COMMENT ON COLUMN public.product_images.large_url IS
  'High-resolution image for zoom.';
