-- =====================================================
-- Remove publish flags from About content/videos
-- =====================================================

-- Drop existing public-read policies that reference published flags
DROP POLICY IF EXISTS "Public read published about_content" ON public.about_content;
DROP POLICY IF EXISTS "Public read published about_videos" ON public.about_videos;
DROP POLICY IF EXISTS "Public read about_content" ON public.about_content;
DROP POLICY IF EXISTS "Public read about_videos" ON public.about_videos;

-- Drop published columns
ALTER TABLE public.about_content DROP COLUMN IF EXISTS published;
ALTER TABLE public.about_videos DROP COLUMN IF EXISTS published;

-- Drop obsolete index
DROP INDEX IF EXISTS public.idx_about_videos_published;

-- Recreate unconditional public read policies for storefront
CREATE POLICY "Public read about_content"
  ON public.about_content FOR SELECT TO public
  USING (true);

CREATE POLICY "Public read about_videos"
  ON public.about_videos FOR SELECT TO public
  USING (true);
