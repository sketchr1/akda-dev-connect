ALTER TABLE public.escrow ADD COLUMN IF NOT EXISTS payment_intent_id text;
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'active';