'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { logAudit, requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { toCents } from '@/lib/money';

export interface CouponState {
  error?: string;
  ok?: string;
}

const CouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, 'El código debe tener al menos 3 caracteres.')
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, 'Usa solo letras, números, guion y guion bajo.'),
  type: z.enum(['percent', 'fixed']),
  value: z.string().min(1, 'Indica el valor del descuento.'),
  min_subtotal: z.string().optional(),
  max_redemptions: z.string().optional(),
  ends_at: z.string().optional(),
});

export async function createCoupon(
  _prev: CouponState,
  formData: FormData,
): Promise<CouponState> {
  const { store } = await requireAdmin();
  const supabase = await createClient();

  const parsed = CouponSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };
  }

  const d = parsed.data;

  // Un porcentaje se guarda como 1-100; un monto fijo, en centavos. Mezclar
  // ambas unidades en la misma columna sería una bomba de tiempo.
  const value =
    d.type === 'percent' ? Math.round(Number(d.value)) : toCents(d.value);

  if (d.type === 'percent' && (value < 1 || value > 100)) {
    return { error: 'El porcentaje debe estar entre 1 y 100.' };
  }
  if (value <= 0) return { error: 'El descuento debe ser mayor a cero.' };

  const { error } = await supabase.from('coupons').insert({
    store_id: store.id,
    code: d.code.toUpperCase(),
    type: d.type,
    value,
    min_subtotal_cents: d.min_subtotal ? toCents(d.min_subtotal) : 0,
    max_redemptions: d.max_redemptions ? Number(d.max_redemptions) : null,
    ends_at: d.ends_at ? new Date(d.ends_at).toISOString() : null,
  });

  if (error) {
    return {
      error: error.code === '23505'
        ? 'Ya existe un cupón con ese código.'
        : `No pudimos crearlo: ${error.message}`,
    };
  }

  await logAudit(store.id, 'coupon.create', 'coupon', null, { code: d.code });
  revalidatePath('/admin/cupones');

  return { ok: `Cupón ${d.code.toUpperCase()} creado.` };
}
