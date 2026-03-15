-- =====================================================
-- DATABASE PORTABILITY: Remove RLS and all DB-level auth.
-- Authorization is implemented in application (TypeScript) only.
-- =====================================================

-- Drop trigger that writes to profiles on auth.users insert (Supabase Auth)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop auth-related functions (CASCADE drops policies that depend on is_admin())
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- Drop all RLS policies (public schema only)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

DROP POLICY IF EXISTS "Anyone can read store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admins can update store settings" ON public.store_settings;

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

DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can insert site settings" ON public.site_settings;

-- Disable RLS on all app tables
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribute_definitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attribute_values DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings DISABLE ROW LEVEL SECURITY;
