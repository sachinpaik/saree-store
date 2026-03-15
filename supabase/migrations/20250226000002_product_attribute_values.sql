-- Per-product attribute values (replaces/in addition to products.attributes JSONB for structured specs)
CREATE TABLE IF NOT EXISTS public.product_attribute_values (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  attribute_key TEXT NOT NULL REFERENCES public.attribute_definitions(key) ON DELETE CASCADE,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (product_id, attribute_key)
);

CREATE INDEX IF NOT EXISTS idx_product_attribute_values_product_id ON public.product_attribute_values(product_id);

ALTER TABLE public.product_attribute_values ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read product attribute values" ON public.product_attribute_values;
CREATE POLICY "Anyone can read product attribute values"
  ON public.product_attribute_values FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Admins can manage product attribute values" ON public.product_attribute_values;
CREATE POLICY "Admins can manage product attribute values"
  ON public.product_attribute_values FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

COMMENT ON TABLE public.product_attribute_values IS 'Per-product attribute values; key references attribute_definitions.key.';
