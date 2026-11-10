import { NextResponse, type NextRequest } from 'next/server';

import { getAdminContext } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { toCsv } from '@/lib/csv';
import { fromCents } from '@/lib/money';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Exporta el inventario como CSV para subirlo a los marketplaces.
 *
 * Esto es lo que cierra el ciclo sin APIs: las ventas entran por importación
 * y las existencias salen por aquí, listas para cargarse en Amazon, Walmart
 * o TikTok Shop.
 *
 * Si el canal tiene `stock_buffer`, se resta de la cantidad publicada. Ese
 * colchón es lo que evita vender la última pieza en dos lados a la vez,
 * porque ningún marketplace refleja el stock al instante.
 */
export async function GET(request: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });

  const channelId = request.nextUrl.searchParams.get('canal');
  const supabase = await createClient();

  let buffer = 0;
  let channelName = 'general';
  let channelId_ = channelId;

  if (channelId) {
    const { data: channel } = await supabase
      .from('sales_channels')
      .select('id, name, type, stock_buffer')
      .eq('id', channelId)
      .eq('store_id', ctx.store.id)
      .maybeSingle();

    if (!channel) return NextResponse.json({ error: 'Canal no encontrado.' }, { status: 404 });
    buffer = channel.stock_buffer;
    channelName = channel.type;
    channelId_ = channel.id;
  }

  const { data: variants } = await supabase
    .from('product_variants')
    .select(`
      id, sku, name, stock, price_cents,
      product:products!inner(name, status, track_inventory, price_cents)
    `)
    .eq('store_id', ctx.store.id)
    .eq('is_active', true)
    .order('sku');

  type Row = {
    id: string; sku: string | null; name: string; stock: number; price_cents: number | null;
    product: { name: string; status: string; track_inventory: boolean; price_cents: number };
  };

  // SKU específicos del canal: si existen, mandan sobre el SKU del catálogo.
  const overrides = new Map<string, string>();
  if (channelId_) {
    const { data: listings } = await supabase
      .from('channel_listings')
      .select('variant_id, external_sku')
      .eq('store_id', ctx.store.id)
      .eq('channel_id', channelId_)
      .eq('is_active', true);

    for (const l of listings ?? []) overrides.set(l.variant_id, l.external_sku);
  }

  const rows = ((variants ?? []) as unknown as Row[])
    .filter((v) => v.product.status === 'active')
    .map((v) => {
      const publishable = v.product.track_inventory
        ? Math.max(v.stock - buffer, 0)
        : 999;

      return {
        sku: overrides.get(v.id) ?? v.sku ?? '',
        producto: v.product.name,
        presentacion: v.name,
        cantidad: publishable,
        stock_real: v.stock,
        precio: fromCents(v.price_cents ?? v.product.price_cents),
      };
    })
    .filter((r) => r.sku !== '');  // sin SKU no hay nada que casar allá

  const today = new Date().toISOString().slice(0, 10);
  const filename = `inventario-${channelName}-${today}.csv`;

  // BOM para que Excel abra bien los acentos: sin esto "Presentación" se ve roto.
  return new NextResponse('﻿' + toCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
