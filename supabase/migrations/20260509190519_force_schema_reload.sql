/*
  # Force PostgREST schema cache reload

  Sends the reload signal and ensures all grants are in place.
*/

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.leads TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
