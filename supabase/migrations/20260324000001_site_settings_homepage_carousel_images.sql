ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS homepage_carousel_image_keys TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

COMMENT ON COLUMN public.site_settings.homepage_carousel_image_keys
  IS 'Ordered storage keys for homepage carousel images uploaded from admin settings.';
