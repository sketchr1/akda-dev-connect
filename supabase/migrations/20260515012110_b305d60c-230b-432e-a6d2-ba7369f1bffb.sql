
ALTER TABLE public.coder_profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id text;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS coder_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'escrow_status' AND e.enumlabel = 'released'
  ) THEN
    ALTER TYPE public.escrow_status ADD VALUE 'released';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'project_status' AND e.enumlabel = 'completed'
  ) THEN
    ALTER TYPE public.project_status ADD VALUE 'completed';
  END IF;
END $$;
