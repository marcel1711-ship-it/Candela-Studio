import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { createAdminClient } from '@/lib/supabase/admin';
import { getStoreForHost } from '@/lib/tenant';
import { canAcceptPayments, onBehalfOf, platformFeeCents, stripe } from '@/lib/stripe';
import type { ShippingRate } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Crea la sesión de pago.
 *
 * Regla que gobierna todo este archivo: NADA que venga del navegador se usa
 * para cobrar. El cliente manda ids y cantidades; los precios, el stock y los
 * totales salen de la base de datos. Si se confiara en el precio del carrito,
 * cualquiera podría comprar un perfume de $200 en $1 editando localStorage.
 */

const CheckoutSchema = z.object({
  items: z
    .array(
      z.object({
        variant_id: z.string().uuid(),
        quantity: z.number().int().positive().max(99),
      }),
    )
    .min(1, 'El carrito está vacío.')
    .max(50),
  coupon_code: z.string().trim().max(40).optional(),
  email: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  // ── Tenant ────────────────────────────────────────────────────────────────
  const host =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'localhost';
  const store = await getStoreForHost(host);

  if (!store || store.status === 'suspended') {
    return NextResponse.json({ error: 'Tienda no disponible.' }, { status: 404 });
  }

  if (!canAcceptPayments(store)) {
    return NextResponse.json(
      { error: 'Esta tienda todavía no tiene los pagos activados. Conecta Stripe desde el panel.' },
      { status: 503 },
    );
  }

  // ── Entrada ───────────────────────────────────────────────────────────────
  const parsed = CheckoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Solicitud inválida.' },
      { status: 400 },
    );
  }

  const { items, coupon_code, email } = parsed.data;
  const db = createAdminClient();

  // Consolidamos duplicados: dos líneas de la misma variante son una sola.
  const wanted = new Map<string, number>();
  for (const item of items) {
    wanted.set(item.variant_id, (wanted.get(item.variant_id) ?? 0) + item.quantity);
  }

  // ── Precios y stock: fuente de verdad del servidor ────────────────────────
  // El .eq('store_id') es lo que impide comprar el producto de OTRA tienda
  // mandando su variant_id: aquí usamos service_role y RLS no nos protege.
  const { data: variants, error: variantsError } = await db
    .from('product_variants')
    .select(`
      id, stock, price_cents, name, sku, is_active, store_id,
      product:products!inner(
        id, name, slug, status, price_cents, track_inventory, requires_shipping,
        images:product_images(url, position)
      )
    `)
    .eq('store_id', store.id)
    .eq('is_active', true)
    .in('id', [...wanted.keys()]);

  if (variantsError) {
    return NextResponse.json({ error: 'No pudimos leer el catálogo.' }, { status: 500 });
  }

  type VariantRow = NonNullable<typeof variants>[number] & {
    product: {
      id: string; name: string; slug: string; status: string;
      price_cents: number; track_inventory: boolean; requires_shipping: boolean;
      images: { url: string; position: number }[];
    };
  };

  const rows = (variants ?? []) as unknown as VariantRow[];
  const available = rows.filter((v) => v.product?.status === 'active');

  if (available.length !== wanted.size) {
    return NextResponse.json(
      { error: 'Uno o más productos ya no están disponibles. Actualiza tu carrito.' },
      { status: 409 },
    );
  }

  // ── Disponibilidad ────────────────────────────────────────────────────────
  // Validar aquí evita cobrar por algo que no existe. El descuento real es
  // atómico y ocurre en el webhook, ya con el pago confirmado.
  const outOfStock = available.filter((v) => {
    const qty = wanted.get(v.id)!;
    return v.product.track_inventory && v.stock < qty;
  });

  if (outOfStock.length > 0) {
    return NextResponse.json(
      {
        error: `Sin stock suficiente de ${outOfStock[0].product.name}. Disponible: ${outOfStock[0].stock}.`,
        out_of_stock: outOfStock.map((v) => ({ variant_id: v.id, available: v.stock })),
      },
      { status: 409 },
    );
  }

  // ── Totales ───────────────────────────────────────────────────────────────
  const lines = available.map((v) => {
    const quantity = wanted.get(v.id)!;
    const unit = v.price_cents ?? v.product.price_cents;
    const image = [...(v.product.images ?? [])].sort((a, b) => a.position - b.position)[0];

    return {
      variant: v,
      quantity,
      unitPriceCents: unit,
      totalCents: unit * quantity,
      imageUrl: image?.url ?? null,
    };
  });

  const subtotalCents = lines.reduce((sum, l) => sum + l.totalCents, 0);

  // ── Cupón (validado contra la base, nunca contra el cliente) ──────────────
  let discountCents = 0;
  let appliedCoupon: string | null = null;

  if (coupon_code) {
    const { data: coupon } = await db
      .from('coupons')
      .select('*')
      .eq('store_id', store.id)
      .ilike('code', coupon_code)
      .eq('is_active', true)
      .maybeSingle();

    const now = new Date();
    const valid =
      coupon &&
      subtotalCents >= coupon.min_subtotal_cents &&
      (!coupon.starts_at || new Date(coupon.starts_at) <= now) &&
      (!coupon.ends_at || new Date(coupon.ends_at) >= now) &&
      (coupon.max_redemptions === null || coupon.times_redeemed < coupon.max_redemptions);

    if (!valid) {
      return NextResponse.json({ error: 'El cupón no es válido o ya expiró.' }, { status: 400 });
    }

    discountCents =
      coupon.type === 'percent'
        ? Math.floor((subtotalCents * coupon.value) / 100)
        : Math.min(coupon.value, subtotalCents);
    appliedCoupon = coupon.code;
  }

  // ── Envío ─────────────────────────────────────────────────────────────────
  const needsShipping = lines.some((l) => l.variant.product.requires_shipping);

  const { data: rateRows } = await db
    .from('shipping_rates')
    .select('*')
    .eq('store_id', store.id)
    .eq('is_active', true)
    .order('position');

  const rates = (rateRows ?? []) as ShippingRate[];
  const afterDiscount = subtotalCents - discountCents;

  const shippingOptions = needsShipping
    ? rates.map((rate) => {
        // "Envío gratis sobre $X" se aplica sobre el subtotal ya descontado.
        const free = rate.free_over_cents !== null && afterDiscount >= rate.free_over_cents;
        return {
          shipping_rate_data: {
            type: 'fixed_amount' as const,
            fixed_amount: {
              amount: free ? 0 : rate.price_cents,
              currency: store.currency.toLowerCase(),
            },
            display_name: free ? `${rate.name} (gratis)` : rate.name,
            ...(rate.min_days && rate.max_days
              ? {
                  delivery_estimate: {
                    minimum: { unit: 'business_day' as const, value: rate.min_days },
                    maximum: { unit: 'business_day' as const, value: rate.max_days },
                  },
                }
              : {}),
          },
        };
      })
    : [];

  // ── Pedido en estado pendiente ────────────────────────────────────────────
  // Se crea ANTES de Stripe: si el webhook llega primero (pasa), ya hay fila
  // que actualizar y nada se pierde.
  const { data: orderNumber } = await db.rpc('next_order_number', { p_store_id: store.id });

  const { data: order, error: orderError } = await db
    .from('orders')
    .insert({
      store_id: store.id,
      order_number: orderNumber,
      email: email?.toLowerCase() ?? 'pendiente@checkout',
      status: 'pending',
      currency: store.currency,
      subtotal_cents: subtotalCents,
      discount_cents: discountCents,
      total_cents: afterDiscount,
      coupon_code: appliedCoupon,
    })
    .select('id, order_number')
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'No pudimos crear el pedido.' }, { status: 500 });
  }

  const { error: itemsError } = await db.from('order_items').insert(
    lines.map((l) => ({
      store_id: store.id,
      order_id: order.id,
      product_id: l.variant.product.id,
      variant_id: l.variant.id,
      product_name: l.variant.product.name,
      variant_name: l.variant.name,
      sku: l.variant.sku,
      image_url: l.imageUrl,
      unit_price_cents: l.unitPriceCents,
      quantity: l.quantity,
      total_cents: l.totalCents,
    })),
  );

  if (itemsError) {
    await db.from('orders').delete().eq('id', order.id);
    return NextResponse.json({ error: 'No pudimos registrar el pedido.' }, { status: 500 });
  }

  // ── Sesión de Stripe ──────────────────────────────────────────────────────
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? `https://${host}`;

  try {
    const session = await stripe().checkout.sessions.create(
      {
        mode: 'payment',
        locale: 'es',
        customer_email: email,
        client_reference_id: order.id,
        line_items: lines.map((l) => ({
          quantity: l.quantity,
          price_data: {
            currency: store.currency.toLowerCase(),
            unit_amount: l.unitPriceCents,
            product_data: {
              name: l.variant.product.name,
              ...(l.variant.name && l.variant.name !== 'Única'
                ? { description: l.variant.name }
                : {}),
              ...(l.imageUrl ? { images: [l.imageUrl] } : {}),
            },
          },
        })),
        ...(discountCents > 0
          ? {
              discounts: [
                {
                  coupon: (
                    await stripe().coupons.create(
                      {
                        amount_off: discountCents,
                        currency: store.currency.toLowerCase(),
                        duration: 'once',
                        name: appliedCoupon ?? 'Descuento',
                      },
                      onBehalfOf(store),
                    )
                  ).id,
                },
              ],
            }
          : {}),
        ...(needsShipping
          ? {
              shipping_address_collection: { allowed_countries: ['US', 'PR'] },
              ...(shippingOptions.length > 0 ? { shipping_options: shippingOptions } : {}),
            }
          : {}),
        phone_number_collection: { enabled: true },
        // La comisión de Candela sale del subtotal de producto, nunca del flete.
        ...(platformFeeCents(store, afterDiscount) > 0
          ? { payment_intent_data: { application_fee_amount: platformFeeCents(store, afterDiscount) } }
          : {}),
        // El webhook se apoya en estos metadatos para saber a qué tienda y
        // pedido pertenece el pago sin tener que adivinar.
        metadata: {
          order_id: order.id,
          store_id: store.id,
          order_number: order.order_number,
          ...(appliedCoupon ? { coupon_code: appliedCoupon } : {}),
        },
        success_url: `${origin}/gracias?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/tienda?pago=cancelado`,
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      },
      onBehalfOf(store),
    );

    await db
      .from('orders')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', order.id);

    return NextResponse.json({ url: session.url, order_id: order.id });
  } catch (err) {
    // El pedido huérfano se queda en 'pending' para poder diagnosticarlo.
    console.error('[checkout] Stripe falló:', err);
    return NextResponse.json(
      { error: 'No pudimos iniciar el pago. Intenta de nuevo en un momento.' },
      { status: 502 },
    );
  }
}
