'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { logAudit, requireAdmin, requireOwner } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export interface SettingsState {
  error?: string;
  ok?: string;
}

const SettingsSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es obligatorio.').max(80),
  tagline: z.string().trim().max(120).optional(),
  description: z.string().trim().max(600).optional(),
  support_email: z.string().trim().email('Correo inválido.').max(160).optional().or(z.literal('')),
  support_phone: z.string().trim().max(40).optional(),
  whatsapp_number: z.string().trim().max(40).optional(),
  low_stock_threshold: z.coerce.number().int().min(0).max(10_000),
  alert_emails: z.string().trim().max(600).optional(),
});

export async function saveSettings(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { store } = await requireAdmin();
  const supabase = await createClient();

  const parsed = SettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };
  }

  const d = parsed.data;

  // Una lista de correos separada por comas es lo más natural de escribir;
  // la normalizamos aquí y no le pedimos al cliente que aprenda otro formato.
  const alertEmails = (d.alert_emails ?? '')
    .split(/[,\n;]/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    .slice(0, 10);

  const { error } = await supabase
    .from('stores')
    .update({
      name: d.name,
      tagline: d.tagline || null,
      description: d.description || null,
      support_email: d.support_email || null,
      support_phone: d.support_phone || null,
      whatsapp_number: d.whatsapp_number || null,
      low_stock_threshold: d.low_stock_threshold,
      alert_emails: alertEmails,
    })
    .eq('id', store.id);

  if (error) return { error: `No pudimos guardar: ${error.message}` };

  await logAudit(store.id, 'store.settings', 'store', store.id, {
    low_stock_threshold: d.low_stock_threshold,
  });

  revalidatePath('/admin/configuracion');
  revalidatePath('/');

  return { ok: 'Cambios guardados.' };
}

/** Desconecta Stripe. Solo el propietario: toca el cobro del negocio. */
export async function disconnectStripe(): Promise<void> {
  const { store } = await requireOwner();
  const supabase = await createClient();

  await supabase
    .from('stores')
    .update({
      stripe_account_id: null,
      stripe_charges_enabled: false,
      stripe_payouts_enabled: false,
      stripe_onboarded_at: null,
    })
    .eq('id', store.id);

  await logAudit(store.id, 'stripe.disconnect', 'store', store.id);

  revalidatePath('/admin/configuracion');
}
