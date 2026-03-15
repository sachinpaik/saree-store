-- Seed default attribute definitions (run after migrations 20250226000001 and 20250226000002).
-- Run with: psql $DATABASE_URL -f supabase/seed_attribute_definitions.sql
-- Or via Supabase dashboard SQL editor.
-- Idempotent: use ON CONFLICT to avoid errors on re-run.

INSERT INTO public.attribute_definitions (key, label, "group", input_type, options_json, sort_order, is_active, is_required)
VALUES
  ('fabric', 'Fabric', 'Specifications', 'text', NULL, 10, TRUE, FALSE),
  ('weaving_technique', 'Weaving Technique', 'Specifications', 'text', NULL, 20, TRUE, FALSE),
  ('border_style', 'Border Style', 'Specifications', 'text', NULL, 30, TRUE, FALSE),
  ('pallu', 'Pallu', 'Specifications', 'text', NULL, 40, TRUE, FALSE),
  ('blouse_piece', 'Blouse Piece', 'Specifications', 'text', NULL, 50, TRUE, FALSE),
  ('length', 'Length', 'Specifications', 'text', NULL, 60, TRUE, FALSE),
  ('care_instructions', 'Care Instructions', 'Specifications', 'textarea', NULL, 70, TRUE, FALSE)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  "group" = EXCLUDED."group",
  input_type = EXCLUDED.input_type,
  options_json = EXCLUDED.options_json,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  is_required = EXCLUDED.is_required;
