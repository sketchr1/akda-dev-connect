
-- 1) Remove unused, publicly-readable financial identifier
ALTER TABLE public.coder_profiles DROP COLUMN IF EXISTS stripe_account_id;

-- 2) Restrict user_roles SELECT to the row owner (has_role() is SECURITY DEFINER and bypasses RLS)
DROP POLICY IF EXISTS "User roles viewable by everyone" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3) Prevent participants from spoofing system messages
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  is_system = false
  AND ((sender_id IS NULL) OR (sender_id = auth.uid()))
  AND EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = messages.workspace_id
      AND (auth.uid() = w.customer_id OR auth.uid() = w.coder_id)
  )
);
