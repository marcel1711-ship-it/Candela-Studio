/*
  # Reload PostgREST schema cache

  Forces PostgREST to reload its schema cache so the leads table
  and all its columns are recognized by the REST API.
*/

NOTIFY pgrst, 'reload schema';
