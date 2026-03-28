CREATE TABLE IF NOT EXISTS public.about_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  intro_text TEXT NOT NULL DEFAULT '',
  body_html TEXT NOT NULL DEFAULT '',
  published BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.about_content (title, intro_text, body_html, published)
SELECT '', '', '', FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.about_content);

DROP TRIGGER IF EXISTS about_content_updated_at ON public.about_content;
CREATE TRIGGER about_content_updated_at
  BEFORE UPDATE ON public.about_content
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.about_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  thumbnail_key TEXT,
  video_360_key TEXT,
  video_720_key TEXT,
  video_1080_key TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_about_videos_sort_order
  ON public.about_videos(sort_order ASC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_about_videos_published
  ON public.about_videos(published);
