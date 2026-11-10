'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { logAudit, requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

/**
 * Importación de CSV de marketplaces.
 *
 * El CSV se lee en el navegador (vista previa instantánea) y aquí llegan solo
 * las filas ya mapeadas. Eso mantiene la carga pequeña y deja la validación
 * pesada —casar SKU contra el catálogo— del lado del servidor, que es donde
 * está la verdad.
 */

export interface ImportState {
  error?: string;
  ok?: string;
  batchId?: string;
  issues?: Array<{ row: number; sku: string; reason: string }>;
}

const SaleRowSchema = z.object({
  external_order_id: z.string().trim().max(120).optional(),
  sku: z.string().trim().min(1).max(120),
  quantity: z.number().int().positive().max(10_000),
  unit_price_cents: z.number().int().min(0).max(100_000_000).nullable(),
  date: z.string().optional(),
  buyer_email: z.string().trim().max(160).optional(),
  buyer_name: z.string().trim().max(160).optional(),
});

const ImportSalesSchema = z.object({
  channel_id: z.string().uuid(),
  filename: z.string().max(260).optional(),
  rows: z.array(SaleRowSchema).min(1).max(20_000),
});

/** Resuelve SKU → variante. Primero el SKU del canal, luego el del catálogo. */
async function resolveSkus(
  storeId: string,
  channelId: string,
  skus: string[],
): Promise<Map<string, { variantId: string; productId: string; productName: string;
                        variantName: string; priceCents: number }>> {
  const supabase = await createClient();
  const lower = [...new Set(skus.map((s) => s.toLowerCase()))];
  const found = new Map<string, {
    variantId: string; productId: string; productName: string;
    variantName: string; priceCents: number;
  }>();

  // 1) Mapeo específico del canal: gana siempre, porque un marketplace puede
  //    usar un SKU distinto para el mismo producto.
  const { data: listings } = await supabase
    .from('channel_listings')
    .select(`
      external_sku,
      variant:product_variants(
        id, name, price_cents, product_id,
        product:products(id, name, price_cents)
      )
    `)
    .eq('store_id', storeId)
    .eq('channel_id', channelId)
    .eq('is_active', true);

  type ListingRow = {
    external_sku: string;
    variant: {
      id: string; name: string; price_cents: number | null; product_id: string;
      product: { id: string; name: string; price_cents: number } | null;
    } | null;
  };

  for (const row of (listings ?? []) as unknown as ListingRow[]) {
    if (!row.variant?.product) continue;
    found.set(row.external_sku.toLowerCase(), {
      variantId: row.variant.id,
      productId: row.variant.product.id,
      productName: row.variant.product.name,
      variantName: row.variant.name,
      priceCents: row.variant.price_cents ?? row.variant.product.price_cents,
    });
  }

  // 2) SKU propio del catálogo, para lo que no tenga mapeo explícito.
  const pending = lower.filter((s) => !found.has(s));
  if (pending.length > 0) {
    const { data: variants } = await supabase
      .from('product_variants')
      .select('id, sku, name, price_cents, product:products(id, name, price_cents)')
      .eq('store_id', storeId)
      .not('sku', 'is', null);

    type VariantRow = {
      id: string; sku: string | null; name: string; price_cents: number | null;
      product: { id: string; name: string; price_cents: number } | null;
    };

    for (const v of (variants ?? []) as unknown as VariantRow[]) {
      if (!v.sku || !v.product) continue;
      const key = v.sku.toLowerCase();
      if (found.has(key)) continue;
      found.set(key, {
        variantId: v.id,
        productId: v.product.id,
        productName: v.product.name,
        variantName: v.name,
        priceCents: v.price_cents ?? v.product.price_cents,
      });
    }
  }

  return found;
}

/** Vista previa: cuántos SKU casan y cuáles no, antes de tocar nada. */
export async function checkSkus(
  channelId: string,
  skus: string[],
): Promise<{ matched: string[]; unmatched: string[] }> {
  const { store } = await requireAdmin();
  const resolved = await resolveSkus(store.id, channelId, skus.slice(0, 20_000));

  const matched: string[] = [];
  const unmatched: string[] = [];

  for (const sku of [...new Set(skus)]) {
    (resolved.has(sku.toLowerCase()) ? matched : unmatched).push(sku);
  }
  return { matched, unmatched };
}

/**
 * Importa ventas de un marketplace.
 *
 * Idempotente por el índice único (store_id, channel_id, external_order_id):
 * reimportar el reporte del mes no duplica pedidos ni vuelve a descontar.
 */
export async function importSales(
  input: z.infer<typeof ImportSalesSchema>,
): Promise<ImportState> {
  const { store } = await requireAdmin();

  const parsed = ImportSalesSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos de importación inválidos.' };
  }

  const { channel_id, filename, rows } = parsed.data;
  const supabase = await createClient();

  const { data: channel } = await supabase
    .from('sales_channels')
    .select('id, name, type')
    .eq('id', channel_id)
    .eq('store_id', store.id)
    .maybeSingle();

  if (!channel) return { error: 'El canal no existe o no es de esta tienda.' };

  const resolved = await resolveSkus(store.id, channel_id, rows.map((r) => r.sku));

  // ── Agrupar por pedido ────────────────────────────────────────────────────
  // Un pedido puede venir en varias filas (una por producto). Sin agrupar,
  // un pedido de 3 artículos se contaría como 3 ventas.
  const groups = new Map<string, typeof rows>();
  for (const [i, row] of rows.entries()) {
    const key = row.external_order_id?.trim() || `__fila_${i}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  // ── Saltar lo ya importado ────────────────────────────────────────────────
  const externalIds = [...groups.keys()].filter((k) => !k.startsWith('__fila_'));
  const alreadyImported = new Set<string>();

  if (externalIds.length > 0) {
    for (let i = 0; i < externalIds.length; i += 500) {
      const { data: existing } = await supabase
        .from('orders')
        .select('external_order_id')
        .eq('store_id', store.id)
        .eq('channel_id', channel_id)
        .in('external_order_id', externalIds.slice(i, i + 500));

      for (const o of existing ?? []) {
        if (o.external_order_id) alreadyImported.add(o.external_order_id);
      }
    }
  }

  const issues: Array<{ row: number; sku: string; reason: string }> = [];

  const { data: batch, error: batchError } = await supabase
    .from('import_batches')
    .insert({
      store_id: store.id,
      channel_id,
      kind: 'sales',
      filename: filename ?? null,
      rows_total: rows.length,
    })
    .select('id')
    .single();

  if (batchError || !batch) return { error: `No pudimos registrar la importación: ${batchError?.message}` };

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const [externalId, groupRows] of groups) {
    const isSynthetic = externalId.startsWith('__fila_');

    if (!isSynthetic && alreadyImported.has(externalId)) {
      skipped += groupRows.length;
      continue;
    }

    const items = [];
    let subtotal = 0;

    for (const row of groupRows) {
      const match = resolved.get(row.sku.toLowerCase());
      const rowIndex = rows.indexOf(row) + 2;  // +2: encabezado y base 1

      if (!match) {
        issues.push({ row: rowIndex, sku: row.sku, reason: 'SKU no existe en el catálogo' });
        failed += 1;
        continue;
      }

      // Si el CSV no trae precio, usamos el del catálogo: mejor un importe
      // aproximado que un pedido en cero que ensucie los reportes.
      const unit = row.unit_price_cents ?? match.priceCents;
      const total = unit * row.quantity;
      subtotal += total;

      items.push({
        store_id: store.id,
        product_id: match.productId,
        variant_id: match.variantId,
        product_name: match.productName,
        variant_name: match.variantName,
        sku: row.sku,
        unit_price_cents: unit,
        quantity: row.quantity,
        total_cents: total,
      });
    }

    if (items.length === 0) continue;

    const first = groupRows[0];
    const when = first.date ? new Date(first.date) : new Date();
    const paidAt = Number.isNaN(when.getTime()) ? new Date() : when;

    const { data: orderNumber } = await supabase.rpc('next_order_number', {
      p_store_id: store.id,
    });

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        store_id: store.id,
        channel_id,
        external_order_id: isSynthetic ? null : externalId,
        import_batch_id: batch.id,
        order_number: orderNumber,
        email: first.buyer_email?.toLowerCase() || `${channel.type}@marketplace.local`,
        // Se importa como pagado y enviado: son ventas que YA ocurrieron.
        status: 'fulfilled',
        fulfillment_status: 'fulfilled',
        currency: store.currency,
        subtotal_cents: subtotal,
        total_cents: subtotal,
        placed_at: paidAt.toISOString(),
        paid_at: paidAt.toISOString(),
        fulfilled_at: paidAt.toISOString(),
        internal_note: `Importado de ${channel.name}${filename ? ` · ${filename}` : ''}`,
      })
      .select('id')
      .single();

    if (orderError || !order) {
      failed += items.length;
      issues.push({
        row: 0,
        sku: externalId,
        reason: `No se pudo crear el pedido: ${orderError?.message}`,
      });
      continue;
    }

    await supabase.from('order_items').insert(
      items.map((it) => ({ ...it, order_id: order.id })),
    );

    // Descuento atómico, el mismo camino que usa una venta de la web.
    const { error: invError } = await supabase.rpc('apply_order_inventory', {
      p_order_id: order.id,
    });

    if (invError) {
      issues.push({ row: 0, sku: externalId, reason: `Inventario: ${invError.message}` });
    }

    imported += items.length;
  }

  await supabase
    .from('import_batches')
    .update({
      rows_imported: imported,
      rows_skipped: skipped,
      rows_failed: failed,
      issues: issues.slice(0, 200),
      status: imported === 0 && failed > 0 ? 'failed' : 'completed',
    })
    .eq('id', batch.id);

  await logAudit(store.id, 'import.sales', 'import_batch', batch.id, {
    channel: channel.name, imported, skipped, failed,
  });

  revalidatePath('/admin/canales');
  revalidatePath('/admin/inventario');
  revalidatePath('/admin');

  const parts = [`${imported} línea${imported === 1 ? '' : 's'} importada${imported === 1 ? '' : 's'}`];
  if (skipped > 0) parts.push(`${skipped} ya estaban (se omitieron)`);
  if (failed > 0) parts.push(`${failed} con problemas`);

  return { ok: parts.join(' · '), batchId: batch.id, issues: issues.slice(0, 50) };
}

/* ── Inventario ──────────────────────────────────────────────────────────── */

const ImportInventorySchema = z.object({
  channel_id: z.string().uuid(),
  filename: z.string().max(260).optional(),
  mode: z.enum(['absolute', 'delta']),
  rows: z
    .array(z.object({ sku: z.string().trim().min(1).max(120), stock: z.number().int() }))
    .min(1)
    .max(20_000),
});

/**
 * Actualiza existencias desde un CSV.
 *
 * `absolute` fija el valor ("hay 40"); `delta` suma o resta ("llegaron 12").
 * Ambos pasan por adjust_variant_stock, así que cada cambio queda en la
 * bitácora y las alertas de stock bajo se disparan solas.
 */
export async function importInventory(
  input: z.infer<typeof ImportInventorySchema>,
): Promise<ImportState> {
  const { store } = await requireAdmin();

  const parsed = ImportInventorySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
  }

  const { channel_id, filename, mode, rows } = parsed.data;
  const supabase = await createClient();

  const resolved = await resolveSkus(store.id, channel_id, rows.map((r) => r.sku));

  const { data: current } = await supabase
    .from('product_variants')
    .select('id, stock')
    .eq('store_id', store.id);

  const stockById = new Map((current ?? []).map((v) => [v.id, v.stock]));

  const { data: batch } = await supabase
    .from('import_batches')
    .insert({
      store_id: store.id,
      channel_id,
      kind: 'inventory',
      filename: filename ?? null,
      rows_total: rows.length,
    })
    .select('id')
    .single();

  const issues: Array<{ row: number; sku: string; reason: string }> = [];
  let imported = 0;
  let failed = 0;

  for (const [i, row] of rows.entries()) {
    const match = resolved.get(row.sku.toLowerCase());

    if (!match) {
      issues.push({ row: i + 2, sku: row.sku, reason: 'SKU no existe en el catálogo' });
      failed += 1;
      continue;
    }

    const delta =
      mode === 'delta' ? row.stock : row.stock - (stockById.get(match.variantId) ?? 0);

    if (delta === 0) continue;

    const { error } = await supabase.rpc('adjust_variant_stock', {
      p_variant_id: match.variantId,
      p_delta: delta,
      p_reason: delta > 0 ? 'restock' : 'adjustment',
      p_note: `Importación${filename ? ` · ${filename}` : ''}`,
    });

    if (error) {
      issues.push({ row: i + 2, sku: row.sku, reason: error.message });
      failed += 1;
    } else {
      imported += 1;
    }
  }

  if (batch) {
    await supabase
      .from('import_batches')
      .update({
        rows_imported: imported,
        rows_failed: failed,
        issues: issues.slice(0, 200),
        status: imported === 0 && failed > 0 ? 'failed' : 'completed',
      })
      .eq('id', batch.id);
  }

  await logAudit(store.id, 'import.inventory', 'import_batch', batch?.id ?? null, {
    mode, imported, failed,
  });

  revalidatePath('/admin/inventario');
  revalidatePath('/admin/canales');

  return {
    ok: `${imported} producto${imported === 1 ? '' : 's'} actualizado${imported === 1 ? '' : 's'}` +
        (failed > 0 ? ` · ${failed} sin coincidencia` : ''),
    batchId: batch?.id,
    issues: issues.slice(0, 50),
  };
}

/** Deshace una importación: devuelve el inventario y cancela sus pedidos. */
export async function revertBatch(batchId: string): Promise<ImportState> {
  const { store } = await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('revert_import_batch', { p_batch_id: batchId });
  if (error) return { error: error.message };

  await logAudit(store.id, 'import.revert', 'import_batch', batchId);

  revalidatePath('/admin/canales');
  revalidatePath('/admin/inventario');

  return { ok: `Importación revertida: ${data ?? 0} pedido(s) cancelados y stock devuelto.` };
}

/* ── Canales ─────────────────────────────────────────────────────────────── */

export async function saveChannel(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const { store } = await requireAdmin();
  const supabase = await createClient();

  const schema = z.object({
    type: z.enum(['amazon', 'walmart', 'tiktok', 'etsy', 'ebay', 'mercadolibre', 'otro']),
    name: z.string().trim().min(2).max(60),
    stock_buffer: z.coerce.number().int().min(0).max(1000).default(0),
  });

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'Revisa los datos del canal.' };

  const { error } = await supabase
    .from('sales_channels')
    .upsert(
      { store_id: store.id, ...parsed.data },
      { onConflict: 'store_id,type' },
    );

  if (error) return { error: `No se pudo guardar: ${error.message}` };

  revalidatePath('/admin/canales');
  return { ok: `Canal "${parsed.data.name}" listo.` };
}

/** Guarda el mapeo de columnas para no volver a pedirlo en cada importación. */
export async function saveChannelMapping(
  channelId: string,
  kind: 'sales' | 'inventory',
  mapping: Record<string, string | undefined>,
) {
  const { store } = await requireAdmin();
  const supabase = await createClient();

  const { data: channel } = await supabase
    .from('sales_channels')
    .select('csv_mapping')
    .eq('id', channelId)
    .eq('store_id', store.id)
    .maybeSingle();

  await supabase
    .from('sales_channels')
    .update({ csv_mapping: { ...(channel?.csv_mapping ?? {}), [kind]: mapping } })
    .eq('id', channelId)
    .eq('store_id', store.id);
}
