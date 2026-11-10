'use client';

import { createBrowserClient } from '@supabase/ssr';

/** Cliente de navegador. Solo llave anon: toda lectura pasa por RLS. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
