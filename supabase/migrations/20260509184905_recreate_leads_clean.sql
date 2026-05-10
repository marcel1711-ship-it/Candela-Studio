/*
  # Recreate leads table with correct permissions

  The leads table exists in the DB but PostgREST cannot see it due to
  missing grants on the public schema. This migration drops and recreates
  the table with all required grants so PostgREST exposes it via REST API.

  1. Tables
    - `leads` - stores form submissions from the website
  2. Security
    - RLS enabled
    - anon INSERT allowed (public form submission)
    - authenticated SELECT allowed (admin access)
  3. Grants
    - USAGE on schema public to anon, authenticated
    - SELECT, INSERT on leads to anon, authenticated
*/

DROP TABLE IF EXISTS public.leads;

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

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a lead"
  ON public.leads FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT ON public.leads TO anon;
GRANT SELECT ON public.leads TO authenticated;

SELECT pg_notify('pgrst', 'reload schema');
