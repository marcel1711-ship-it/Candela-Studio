import 'server-only';

import { createClient } from '@supabase/supabase-js';

/**
 * Cliente con service_role. SALTA RLS POR COMPLETO.
 *
 * Reglas de uso, sin excepciones:
 *   - Solo en route handlers y server actions. Nunca en un componente cliente.
 *   - Solo donde no hay sesión de usuario y el aislamiento se garantiza a mano
 *     (webhook de Stripe, resolución de tenant, checkout público, crons).
 *   - Todo query debe filtrar por store_id explícitamente: aquí la red de
 *     seguridad de RLS no existe.
 *
 * El import de 'server-only' hace que el build falle si alguien lo importa
 * por accidente desde el navegador.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      'Falta SUPABASE_SERVICE_ROLE_KEY. Requerida para checkout, webhooks y resolución de tenant.',
    );
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
