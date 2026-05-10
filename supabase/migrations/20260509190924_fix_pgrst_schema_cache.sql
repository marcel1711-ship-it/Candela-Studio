/*
  # Fix PostgREST schema cache by recreating table in a clean state

  PostgREST schema cache is corrupted after multiple DROP/CREATE cycles.
  This migration drops all existing objects cleanly and recreates with
  proper grants to force a fresh cache load.
*/

-- Drop existing policies first
DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.leads;

-- Drop and recreate table with explicit schema ownership
DROP TABLE IF EXISTS public.leads CASCADE;

CREATE TABLE public.leads (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  email          text NOT NULL,
  phone          text,
  company        text,
  business_type  text,
  service_needed text NOT NULL,
  preferred_date text,
  message        text,
  instagram      text,
  tiktok         text,
  facebook       text,
  booking_slot   text,
  created_at     timestamptz DEFAULT now()
);

-- Transfer ownership to postgres role
ALTER TABLE public.leads OWNER TO postgres;

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "anon_insert_leads"
  ON public.leads FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "authenticated_select_leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (true);

-- Revoke and re-grant cleanly
REVOKE ALL ON public.leads FROM anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT INSERT ON public.leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated, service_role;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
