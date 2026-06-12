
CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coder_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT ALL ON public.workspaces TO service_role;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view workspace" ON public.workspaces FOR SELECT TO authenticated
  USING (auth.uid() = customer_id OR auth.uid() = coder_id);
CREATE POLICY "Customer creates workspace" ON public.workspaces FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Participants update workspace" ON public.workspaces FOR UPDATE TO authenticated
  USING (auth.uid() = customer_id OR auth.uid() = coder_id);
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_workspaces_project ON public.workspaces(project_id);
CREATE INDEX idx_workspaces_customer ON public.workspaces(customer_id);
CREATE INDEX idx_workspaces_coder ON public.workspaces(coder_id);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body text NOT NULL,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view messages" ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND (auth.uid() = w.customer_id OR auth.uid() = w.coder_id)));
CREATE POLICY "Participants can send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    (sender_id IS NULL OR sender_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND (auth.uid() = w.customer_id OR auth.uid() = w.coder_id))
  );
CREATE INDEX idx_messages_workspace ON public.messages(workspace_id, created_at);

ALTER TABLE public.escrow ADD COLUMN IF NOT EXISTS amount_usd numeric NOT NULL DEFAULT 0;
