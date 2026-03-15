-- =====================================================
-- Fix recursion: "Admins can view all profiles" must not
-- read from public.profiles inside the policy (causes infinite recursion).
-- Use a SECURITY DEFINER function so the check bypasses RLS.
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Drop the recursive policy and recreate it using the function
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());
