-- =====================================================
-- App-owned authentication (portable; no Supabase Auth dependency)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_users_email ON public.app_users(email);

-- =====================================================
-- product_images: use storage_key (portable column name)
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'product_images' AND column_name = 'url') THEN
    ALTER TABLE public.product_images RENAME COLUMN url TO storage_key;
  END IF;
END $$;

COMMENT ON COLUMN public.product_images.storage_key IS 'Storage key (path in bucket); serve via /api/media/{key}';
