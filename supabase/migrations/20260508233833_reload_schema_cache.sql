/*
  # Reload PostgREST schema cache
  Forces PostgREST to reload the schema cache so the leads table is recognized via REST API.
*/
NOTIFY pgrst, 'reload schema';
