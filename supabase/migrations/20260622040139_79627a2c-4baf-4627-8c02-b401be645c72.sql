-- Hide sensitive columns from public/authenticated SELECT
REVOKE SELECT (role) ON public.profiles FROM anon, authenticated;
REVOKE SELECT (stripe_account_id) ON public.coder_profiles FROM anon, authenticated;

-- Tighten escrow coder SELECT policy to authenticated role
DROP POLICY IF EXISTS "Escrow viewable by assigned coder" ON public.escrow;
CREATE POLICY "Escrow viewable by assigned coder"
  ON public.escrow FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = escrow.project_id AND p.coder_id = auth.uid()
  ));

-- Secure accessor: a coder can fetch only their own stripe_account_id
CREATE OR REPLACE FUNCTION public.get_my_stripe_account_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT stripe_account_id
  FROM public.coder_profiles
  WHERE profile_id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.get_my_stripe_account_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_stripe_account_id() TO authenticated;