'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { logAudit, requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const FulfillSchema = z.object({
  carrier: z.string().trim().max(60).optional(),
  tracking_number: z.string().trim().max(120).optional(),
  tracking_url: z.string().trim().url().max(500).optional().or(z.literal('')),
});

/** Marca el pedido como enviado y guarda el rastreo. */
export async function fulfillOrder(orderId: string, formData: FormData) {
  const { store } = await requireAdmin();
  const supabase = await createClient();

  const parsed = FulfillSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error('Datos de envío inválidos.');

  const { error } = await supabase
    .from('orders')
    .update({
      fulfillment_status: 'fulfilled',
      status: 'fulfilled',
      fulfilled_at: new Date().toISOString(),
      carrier: parsed.data.carrier || null,
      tracking_number: parsed.data.tracking_number || null,
      tracking_url: parsed.data.tracking_url || null,
    })
    .eq('id', orderId)
    .eq('store_id', store.id)
    .in('status', ['paid', 'fulfilled']);

  if (error) throw new Error(error.message);

  await logAudit(store.id, 'order.fulfill', 'order', orderId, {
    tracking: parsed.data.tracking_number,
  });

  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath('/admin/pedidos');
  revalidatePath('/admin');
}

/**
 * Cancela el pedido y devuelve el stock.
 *
 * NO reembolsa en Stripe: eso se hace desde el panel de Stripe del cliente,
 * que es quien tiene el dinero. Mover plata ajena desde aquí sería pasarse.
 */
export async function cancelOrder(orderId: string, restock: boolean) {
  const { store } = await requireAdmin();
  const supabase = await createClient();

  const { data: order } = await supabase
    .from('orders')
    .select('id, inventory_applied, status')
    .eq('id', orderId)
    .eq('store_id', store.id)
    .maybeSingle();

  if (!order) throw new Error('Pedido no encontrado.');

  if (restock && order.inventory_applied) {
    const { error } = await supabase.rpc('restore_order_inventory', {
      p_order_id: orderId,
      p_reason: 'cancellation',
    });
    if (error) throw new Error(error.message);
  }

  await supabase
    .from('orders')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('store_id', store.id);

  await logAudit(store.id, 'order.cancel', 'order', orderId, { restock });

  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath('/admin/pedidos');
}

export async function saveOrderNote(orderId: string, note: string) {
  const { store } = await requireAdmin();
  const supabase = await createClient();

  await supabase
    .from('orders')
    .update({ internal_note: note.slice(0, 2000) })
    .eq('id', orderId)
    .eq('store_id', store.id);

  revalidatePath(`/admin/pedidos/${orderId}`);
}
