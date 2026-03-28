-- Add optional company logo key for storefront branding.
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS company_logo_key TEXT;

COMMENT ON COLUMN public.site_settings.company_logo_key IS
  'R2 storage key for company logo image. Optional and migration-safe.';
