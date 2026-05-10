/*
  # Grant schema and table permissions to anon/authenticated roles

  PostgREST requires explicit GRANT on the schema and tables to expose
  them via the REST API. Without these grants the table exists in the DB
  but PostgREST cannot see it (PGRST205 error).
*/

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.leads TO anon, authenticated;
