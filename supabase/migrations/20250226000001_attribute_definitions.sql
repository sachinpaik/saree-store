-- Global attribute definitions (used by all products)
CREATE TABLE IF NOT EXISTS public.attribute_definitions (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  "group" TEXT NOT NULL DEFAULT 'Specifications',
  input_type TEXT NOT NULL CHECK (input_type IN ('text', 'textarea', 'select')),
  options_json TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attribute_definitions_active_sort ON public.attribute_definitions(is_active, sort_order) WHERE is_active = TRUE;

ALTER TABLE public.attribute_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active attribute definitions" ON public.attribute_definitions;
CREATE POLICY "Anyone can read active attribute definitions"
  ON public.attribute_definitions FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Admins can manage attribute definitions" ON public.attribute_definitions;
CREATE POLICY "Admins can manage attribute definitions"
  ON public.attribute_definitions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

COMMENT ON TABLE public.attribute_definitions IS 'Global attribute definitions for product specs; admin manages this list.';
