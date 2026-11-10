import 'server-only';

import { cache } from 'react';
import { headers } from 'next/headers';

import { createAdminClient } from '@/lib/supabase/admin';
import type { Store } from '@/lib/types';

/**
 * Resolución de tenant.
 *
 * Orden de precedencia:
 *   1. Dominio propio del cliente          → tiendacliente.com
 *   2. Subdominio de la plataforma         → cliente.wearecandela.com
 *   3. DEV_STORE_SLUG                      → localhost en desarrollo
 *
 * `cache()` de React memoiza por request: resolvemos una vez aunque el layout,
 * la página y el generateMetadata lo pidan por separado.
 */

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'wearecandela.com';

function normalizeHost(rawHost: string): string {
  return rawHost.toLowerCase().split(':')[0].replace(/^www\./, '').trim();
}

/** Devuelve el slug si el host es un subdominio de la plataforma. */
function subdomainOf(host: string): string | null {
  const root = ROOT_DOMAIN.toLowerCase().replace(/^www\./, '');
  if (host === root || !host.endsWith(`.${root}`)) return null;

  const slug = host.slice(0, -(root.length + 1));
  // Subdominios reservados de la plataforma, no son tiendas.
  if (!slug || ['app', 'admin', 'api', 'www'].includes(slug)) return null;
  return slug;
}

export const getStoreForHost = cache(async (host: string): Promise<Store | null> => {
  const db = createAdminClient();
  const clean = normalizeHost(host);

  // 1. Dominio personalizado verificado
  const { data: domainRow } = await db
    .from('store_domains')
    .select('store_id')
    .eq('domain', clean)
    .not('verified_at', 'is', null)
    .maybeSingle();

  let slug: string | null = null;

  if (!domainRow) {
    // 2. Subdominio de plataforma, o 3. fallback de desarrollo
    slug =
      subdomainOf(clean) ??
      (clean === 'localhost' || clean.endsWith('.localhost') || /^\d+\.\d+\.\d+\.\d+$/.test(clean)
        ? process.env.DEV_STORE_SLUG ?? 'candela'
        : null);

    if (!slug) return null;
  }

  const query = db
    .from('stores')
    .select('*')
    .in('status', ['active', 'draft']);

  const { data: store } = domainRow
    ? await query.eq('id', domainRow.store_id).maybeSingle()
    : await query.eq('slug', slug!).maybeSingle();

  return (store as Store) ?? null;
});

/** Tienda del request actual. Lanza si no resuelve: el layout decide qué mostrar. */
export const getCurrentStore = cache(async (): Promise<Store | null> => {
  const headerList = await headers();
  const host =
    headerList.get('x-forwarded-host') ??
    headerList.get('host') ??
    'localhost';
  return getStoreForHost(host);
});

/** Variante estricta para páginas que no tienen sentido sin tienda. */
export async function requireStore(): Promise<Store> {
  const store = await getCurrentStore();
  if (!store) {
    throw new Error('No hay ninguna tienda configurada para este dominio.');
  }
  return store;
}

/** Convierte stores.theme en variables CSS inline para el <body> del tenant. */
export function themeToCssVars(store: Store): Record<string, string> {
  const t = store.theme ?? {};
  const vars: Record<string, string> = {};

  const map: Record<string, string | undefined> = {
    '--c-ink': t.ink,
    '--c-ink-soft': t.inkSoft,
    '--c-cream': t.cream,
    '--c-cream-deep': t.creamDeep,
    '--c-gold': t.gold,
    '--c-gold-light': t.goldLight,
    '--c-gold-deep': t.goldDeep,
  };

  for (const [key, value] of Object.entries(map)) {
    if (value) vars[key] = value;
  }
  return vars;
}
