-- =====================================================
-- Re-enable RLS with admin full access across app tables
-- =====================================================

-- Admin check from Supabase JWT (app_metadata.role = 'admin')
CREATE OR REPLACE FUNCTION public.is_admin_jwt()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
    FALSE
  );
$$;

-- Enable RLS on all app tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribute_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_videos ENABLE ROW LEVEL SECURITY;

-- Drop old/legacy policies (safe if not present)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can read store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admins can update store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can insert site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Anyone can read types" ON public.types;
DROP POLICY IF EXISTS "Admins can insert types" ON public.types;
DROP POLICY IF EXISTS "Admins can update types" ON public.types;
DROP POLICY IF EXISTS "Admins can delete types" ON public.types;
DROP POLICY IF EXISTS "Anyone can read products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
DROP POLICY IF EXISTS "Anyone can read product images" ON public.product_images;
DROP POLICY IF EXISTS "Admins can insert product images" ON public.product_images;
DROP POLICY IF EXISTS "Admins can update product images" ON public.product_images;
DROP POLICY IF EXISTS "Admins can delete product images" ON public.product_images;
DROP POLICY IF EXISTS "Anyone can read active attribute definitions" ON public.attribute_definitions;
DROP POLICY IF EXISTS "Admins can manage attribute definitions" ON public.attribute_definitions;
DROP POLICY IF EXISTS "Anyone can read product attribute values" ON public.product_attribute_values;
DROP POLICY IF EXISTS "Admins can manage product attribute values" ON public.product_attribute_values;

-- Drop policies created by this migration (idempotency)
DROP POLICY IF EXISTS "Admin full access profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin full access app_users" ON public.app_users;
DROP POLICY IF EXISTS "Admin full access store_settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admin full access site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admin full access types" ON public.types;
DROP POLICY IF EXISTS "Admin full access products" ON public.products;
DROP POLICY IF EXISTS "Admin full access product_images" ON public.product_images;
DROP POLICY IF EXISTS "Admin full access attribute_definitions" ON public.attribute_definitions;
DROP POLICY IF EXISTS "Admin full access product_attribute_values" ON public.product_attribute_values;
DROP POLICY IF EXISTS "Admin full access product_drafts" ON public.product_drafts;
DROP POLICY IF EXISTS "Admin full access about_content" ON public.about_content;
DROP POLICY IF EXISTS "Admin full access about_videos" ON public.about_videos;

DROP POLICY IF EXISTS "Public read store_settings" ON public.store_settings;
DROP POLICY IF EXISTS "Public read site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public read types" ON public.types;
DROP POLICY IF EXISTS "Public read approved products" ON public.products;
DROP POLICY IF EXISTS "Public read product_images" ON public.product_images;
DROP POLICY IF EXISTS "Public read active attribute_definitions" ON public.attribute_definitions;
DROP POLICY IF EXISTS "Public read product_attribute_values" ON public.product_attribute_values;
DROP POLICY IF EXISTS "Public read published about_content" ON public.about_content;
DROP POLICY IF EXISTS "Public read published about_videos" ON public.about_videos;

-- Admin full access policies (FOR ALL) on all app tables
CREATE POLICY "Admin full access profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (public.is_admin_jwt())
  WITH CHECK (public.is_admin_jwt());

CREATE POLICY "Admin full access app_users"
  ON public.app_users FOR ALL TO authenticated
  USING (public.is_admin_jwt())
  WITH CHECK (public.is_admin_jwt());

CREATE POLICY "Admin full access store_settings"
  ON public.store_settings FOR ALL TO authenticated
  USING (public.is_admin_jwt())
  WITH CHECK (public.is_admin_jwt());

CREATE POLICY "Admin full access site_settings"
  ON public.site_settings FOR ALL TO authenticated
  USING (public.is_admin_jwt())
  WITH CHECK (public.is_admin_jwt());

CREATE POLICY "Admin full access types"
  ON public.types FOR ALL TO authenticated
  USING (public.is_admin_jwt())
  WITH CHECK (public.is_admin_jwt());

CREATE POLICY "Admin full access products"
  ON public.products FOR ALL TO authenticated
  USING (public.is_admin_jwt())
  WITH CHECK (public.is_admin_jwt());

CREATE POLICY "Admin full access product_images"
  ON public.product_images FOR ALL TO authenticated
  USING (public.is_admin_jwt())
  WITH CHECK (public.is_admin_jwt());

CREATE POLICY "Admin full access attribute_definitions"
  ON public.attribute_definitions FOR ALL TO authenticated
  USING (public.is_admin_jwt())
  WITH CHECK (public.is_admin_jwt());

CREATE POLICY "Admin full access product_attribute_values"
  ON public.product_attribute_values FOR ALL TO authenticated
  USING (public.is_admin_jwt())
  WITH CHECK (public.is_admin_jwt());

CREATE POLICY "Admin full access product_drafts"
  ON public.product_drafts FOR ALL TO authenticated
  USING (public.is_admin_jwt())
  WITH CHECK (public.is_admin_jwt());

CREATE POLICY "Admin full access about_content"
  ON public.about_content FOR ALL TO authenticated
  USING (public.is_admin_jwt())
  WITH CHECK (public.is_admin_jwt());

CREATE POLICY "Admin full access about_videos"
  ON public.about_videos FOR ALL TO authenticated
  USING (public.is_admin_jwt())
  WITH CHECK (public.is_admin_jwt());

-- Public/storefront read policies (read-only)
CREATE POLICY "Public read store_settings"
  ON public.store_settings FOR SELECT TO public
  USING (true);

CREATE POLICY "Public read site_settings"
  ON public.site_settings FOR SELECT TO public
  USING (true);

CREATE POLICY "Public read types"
  ON public.types FOR SELECT TO public
  USING (true);

CREATE POLICY "Public read approved products"
  ON public.products FOR SELECT TO public
  USING (status = 'approved' AND is_discontinued = false);

CREATE POLICY "Public read product_images"
  ON public.product_images FOR SELECT TO public
  USING (true);

CREATE POLICY "Public read active attribute_definitions"
  ON public.attribute_definitions FOR SELECT TO public
  USING (is_active = true);

CREATE POLICY "Public read product_attribute_values"
  ON public.product_attribute_values FOR SELECT TO public
  USING (true);

CREATE POLICY "Public read published about_content"
  ON public.about_content FOR SELECT TO public
  USING (published = true);

CREATE POLICY "Public read published about_videos"
  ON public.about_videos FOR SELECT TO public
  USING (published = true);
