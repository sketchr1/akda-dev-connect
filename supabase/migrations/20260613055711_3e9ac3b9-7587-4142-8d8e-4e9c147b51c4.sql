CREATE TYPE public.coder_availability AS ENUM ('open', 'working', 'busy');

ALTER TABLE public.coder_profiles
  ADD COLUMN availability public.coder_availability NOT NULL DEFAULT 'open',
  ADD COLUMN commendation_count integer NOT NULL DEFAULT 0;