
CREATE TYPE public.project_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.escrow_status AS ENUM ('pending', 'funded', 'released', 'refunded');

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget_usd NUMERIC(12,2) NOT NULL CHECK (budget_usd >= 0),
  deadline DATE NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  status public.project_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.escrow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  status public.escrow_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Projects viewable by everyone"
  ON public.projects FOR SELECT USING (true);

CREATE POLICY "Customers can create own projects"
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update own projects"
  ON public.projects FOR UPDATE TO authenticated
  USING (auth.uid() = customer_id);

CREATE POLICY "Customers can delete own projects"
  ON public.projects FOR DELETE TO authenticated
  USING (auth.uid() = customer_id);

CREATE POLICY "Escrow viewable by project customer"
  ON public.escrow FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.customer_id = auth.uid()));

CREATE POLICY "Customers can create escrow for own projects"
  ON public.escrow FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.customer_id = auth.uid()));

CREATE POLICY "Customers can update escrow for own projects"
  ON public.escrow FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.customer_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER escrow_updated_at BEFORE UPDATE ON public.escrow
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
