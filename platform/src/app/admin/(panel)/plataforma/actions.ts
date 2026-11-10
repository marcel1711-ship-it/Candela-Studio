'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { logAudit, requirePlatformAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Altas y bajas de tiendas. Solo staff de Candela.
 *
 * Usa el cliente service_role porque hay que escribir en `stores` antes de que
 * exista cualquier miembro —no hay nadie a quien RLS pueda autorizar todavía—
 * y porque invitar al dueño toca la API de administración de Auth.
 * `requirePlatformAdmin()` es la única puerta: se valida ANTES de todo.
 */

export interface StoreState {
  error?: string;
  ok?: string;
}

const RESERVED = ['admin', 'app', 'api', 'www', 'blog', 'mail', 'cdn', 'static', 'dashboard'];

const NewStoreSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es obligatorio.').max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, 'El identificador es obligatorio.')
    .max(40)
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Usa solo minúsculas, números y guiones.'),
  tagline: z.string().trim().max(120).optional(),
  owner_email: z.string().trim().email('Correo del dueño inválido.').max(160),
  owner_name: z.string().trim().max(120).optional(),
  currency: z.string().length(3).default('USD'),
  low_stock_threshold: z.coerce.number().int().min(0).max(10_000).default(5),
  platform_fee_pct: z.coerce.number().min(0).max(20).default(0),
});

export async function createStore(
  _prev: StoreState,
  formData: FormData,
): Promise<StoreState> {
  const ctx = await requirePlatformAdmin();

  const parsed = NewStoreSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };
  }

  const d = parsed.data;
  const email = d.owner_email.toLowerCase();

  if (RESERVED.includes(d.slug)) {
    return { error: `"${d.slug}" es un subdominio reservado de la plataforma.` };
  }

  const db = createAdminClient();

  const { data: clash } = await db
    .from('stores')
    .select('id')
    .eq('slug', d.slug)
    .maybeSingle();

  if (clash) return { error: `Ya existe una tienda con el identificador "${d.slug}".` };

  // ── 1. La tienda ──────────────────────────────────────────────────────────
  // Nace en 'draft': visible solo para el equipo hasta que el catálogo esté
  // listo. Publicar una tienda vacía sería peor que no publicarla.
  const { data: store, error: storeError } = await db
    .from('stores')
    .insert({
      slug: d.slug,
      name: d.name,
      tagline: d.tagline || null,
      currency: d.currency.toUpperCase(),
      status: 'draft',
      low_stock_threshold: d.low_stock_threshold,
      platform_fee_bps: Math.round(d.platform_fee_pct * 100),
      support_email: email,
      alert_emails: [email],
    })
    .select('id, slug, name')
    .single();

  if (storeError || !store) {
    return { error: `No pudimos crear la tienda: ${storeError?.message}` };
  }

  // ── 2. El dueño ───────────────────────────────────────────────────────────
  // Puede que ya tenga cuenta (un cliente con dos negocios). Buscamos antes
  // de invitar para no mandarle un correo que no necesita.
  let ownerId: string | null = null;

  const { data: existingProfile } = await db
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingProfile) {
    ownerId = existingProfile.id;
  } else {
    const { data: invited, error: inviteError } = await db.auth.admin.inviteUserByEmail(email, {
      data: { full_name: d.owner_name || null },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/admin/login`,
    });

    if (inviteError || !invited?.user) {
      // La tienda ya existe; no la borramos para no perder el trabajo. El
      // dueño se agrega después desde la misma pantalla.
      return {
        error: `Tienda "${store.name}" creada, pero no se pudo invitar a ${email}: ${inviteError?.message}. Agrégalo manualmente.`,
      };
    }
    ownerId = invited.user.id;
  }

  const { error: memberError } = await db
    .from('store_members')
    .insert({ store_id: store.id, user_id: ownerId, role: 'owner' });

  if (memberError && memberError.code !== '23505') {
    return { error: `Tienda creada, pero falló el acceso del dueño: ${memberError.message}` };
  }

  // ── 3. Mínimos para que la tienda no nazca vacía ──────────────────────────
  await db.from('shipping_rates').insert({
    store_id: store.id,
    name: 'Envío estándar',
    description: 'Terrestre con rastreo',
    countries: ['US', 'PR'],
    price_cents: 895,
    free_over_cents: 7500,
    min_days: 3,
    max_days: 7,
    ground_only: true,
  });

  await logAudit(store.id, 'store.create', 'store', store.id, {
    slug: store.slug,
    owner: email,
    created_by: ctx.email,
  });

  revalidatePath('/admin/plataforma');

  return {
    ok: `Tienda "${store.name}" creada en modo borrador. ${
      existingProfile
        ? `${email} ya tenía cuenta y ahora tiene acceso.`
        : `Enviamos la invitación a ${email}.`
    }`,
  };
}

/**
 * Cambia el estado de una tienda.
 *
 * `suspended` es la palanca comercial ante falta de pago: la tienda muestra
 * "fuera de servicio" y el panel sigue accesible. No se borra nada, así que
 * reactivar es instantáneo cuando el cliente se pone al día.
 */
export async function setStoreStatus(
  storeId: string,
  status: 'draft' | 'active' | 'suspended',
) {
  const ctx = await requirePlatformAdmin();
  const db = createAdminClient();

  const { error } = await db.from('stores').update({ status }).eq('id', storeId);
  if (error) throw new Error(error.message);

  await logAudit(storeId, `store.${status}`, 'store', storeId, { by: ctx.email });

  revalidatePath('/admin/plataforma');
  revalidatePath('/admin');
}

/** Da acceso al panel de una tienda a otra persona (socio, empleado). */
export async function addStoreMember(
  storeId: string,
  email: string,
  role: 'owner' | 'staff',
): Promise<StoreState> {
  await requirePlatformAdmin();
  const db = createAdminClient();

  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return { error: 'Correo inválido.' };
  }

  const { data: profile } = await db
    .from('profiles')
    .select('id')
    .eq('email', clean)
    .maybeSingle();

  let userId = profile?.id ?? null;

  if (!userId) {
    const { data: invited, error } = await db.auth.admin.inviteUserByEmail(clean, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/admin/login`,
    });
    if (error || !invited?.user) return { error: `No se pudo invitar: ${error?.message}` };
    userId = invited.user.id;
  }

  const { error } = await db
    .from('store_members')
    .upsert({ store_id: storeId, user_id: userId, role }, { onConflict: 'store_id,user_id' });

  if (error) return { error: error.message };

  await logAudit(storeId, 'member.add', 'store_member', storeId, { email: clean, role });
  revalidatePath('/admin/plataforma');

  return { ok: `${clean} ahora tiene acceso como ${role === 'owner' ? 'propietario' : 'equipo'}.` };
}
