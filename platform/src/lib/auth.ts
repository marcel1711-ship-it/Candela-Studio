import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import type { MemberRole, Store } from '@/lib/types';

export { ACTIVE_STORE_COOKIE } from '@/lib/auth.shared';
import { ACTIVE_STORE_COOKIE } from '@/lib/auth.shared';

export interface AdminContext {
  userId: string;
  email: string;
  fullName: string | null;
  isPlatformAdmin: boolean;
  stores: Array<Store & { role: MemberRole }>;
  store: Store & { role: MemberRole };
}

/**
 * Contexto del panel: quién eres, qué tiendas administras y en cuál estás.
 *
 * Todas las consultas usan el cliente con sesión, así que RLS decide qué se
 * devuelve. Si alguien manipula la cookie para apuntar a una tienda ajena,
 * simplemente no aparece en `stores` y el acceso se corta.
 */
export const getAdminContext = cache(async (): Promise<AdminContext | null> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, is_platform_admin')
    .eq('id', user.id)
    .maybeSingle();

  const isPlatformAdmin = profile?.is_platform_admin ?? false;

  let stores: Array<Store & { role: MemberRole }> = [];

  if (isPlatformAdmin) {
    // El staff de Candela administra todos los tenants.
    const { data } = await supabase.from('stores').select('*').order('name');
    stores = ((data ?? []) as Store[]).map((s) => ({ ...s, role: 'owner' as MemberRole }));
  } else {
    const { data } = await supabase
      .from('store_members')
      .select('role, store:stores(*)')
      .eq('user_id', user.id);

    stores = ((data ?? []) as unknown as Array<{ role: MemberRole; store: Store }>)
      .filter((row) => row.store)
      .map((row) => ({ ...row.store, role: row.role }));
  }

  if (stores.length === 0) return null;

  const cookieStore = await cookies();
  const preferredId = cookieStore.get(ACTIVE_STORE_COOKIE)?.value;
  const store = stores.find((s) => s.id === preferredId) ?? stores[0];

  return {
    userId: user.id,
    email: profile?.email ?? user.email ?? '',
    fullName: profile?.full_name ?? null,
    isPlatformAdmin,
    stores,
    store,
  };
});

/** Para páginas del panel: redirige si no hay sesión o no administra nada. */
export async function requireAdmin(): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (!ctx) redirect('/admin/login');
  return ctx;
}

/** Acciones reservadas al dueño: finanzas, Stripe, equipo. */
export async function requireOwner(): Promise<AdminContext> {
  const ctx = await requireAdmin();
  if (ctx.store.role !== 'owner' && !ctx.isPlatformAdmin) {
    throw new Error('Esta acción es solo para el propietario de la tienda.');
  }
  return ctx;
}

/** Deja rastro de quién cambió qué. Nunca debe tumbar la operación principal. */
export async function logAudit(
  storeId: string,
  action: string,
  entity: string,
  entityId: string | null,
  diff?: Record<string, unknown>,
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('audit_log').insert({
      store_id: storeId,
      actor_id: user?.id ?? null,
      actor_email: user?.email ?? null,
      action,
      entity,
      entity_id: entityId,
      diff: diff ?? null,
    });
  } catch (err) {
    console.error('[audit] No se pudo registrar:', err);
  }
}

/** Solo para el staff de Candela: crear tiendas, suspender, ver todos los tenants. */
export async function requirePlatformAdmin(): Promise<AdminContext> {
  const ctx = await requireAdmin();
  if (!ctx.isPlatformAdmin) {
    throw new Error('Esta sección es solo para el equipo de Candela.');
  }
  return ctx;
}
