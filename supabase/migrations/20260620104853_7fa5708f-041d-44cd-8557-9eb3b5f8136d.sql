
-- Coder can view escrow for projects they are assigned to
CREATE POLICY "Escrow viewable by assigned coder"
ON public.escrow
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = escrow.project_id AND p.coder_id = auth.uid()
  )
);

-- Restrict the role column on profiles: revoke column read from anon/authenticated.
-- The authoritative source for roles is public.user_roles (queried via has_role()).
REVOKE SELECT (role) ON public.profiles FROM anon;
REVOKE SELECT (role) ON public.profiles FROM authenticated;
-- Keep service_role full access (already has ALL via GRANT ALL).
