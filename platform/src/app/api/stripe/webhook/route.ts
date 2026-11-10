import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';

import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Webhook de Stripe. Única fuente de verdad sobre si un pedido se pagó.
 *
 * Nunca confiamos en el redirect a /gracias para marcar pagado: el comprador
 * puede cerrar el navegador antes de volver, o abrir esa URL a mano.
 *
 * Tres garantías:
 *   1. Firma verificada con el raw body. Sin esto, cualquiera podría declarar
 *      pedidos como pagados con un simple curl.
 *   2. Idempotencia: Stripe reintenta durante días. apply_order_inventory()
 *      revisa inventory_applied bajo lock, así que el stock baja una sola vez.
 *   3. Siempre 200 ante errores propios de datos, para que Stripe no reintente
 *      en bucle un evento que nunca va a funcionar; los fallos quedan en log.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json({ error: 'Falta la firma del webhook.' }, { status: 400 });
  }

  // El cuerpo CRUDO: parsearlo antes invalidaría la firma.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    console.error('[webhook] Firma inválida:', err);
    return NextResponse.json({ error: 'Firma inválida.' }, { status: 400 });
  }

  const db = createAdminClient();

  try {
    switch (event.type) {
      // ── Pago confirmado ──────────────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.payment_status !== 'paid') break;

        const orderId = session.metadata?.order_id ?? session.client_reference_id;
        const storeId = session.metadata?.store_id;

        if (!orderId || !storeId) {
          console.error('[webhook] Sesión sin metadatos de pedido:', session.id);
          break;
        }

        const { data: order } = await db
          .from('orders')
          .select('id, store_id, status, email')
          .eq('id', orderId)
          .eq('store_id', storeId)
          .maybeSingle();

        if (!order) {
          console.error('[webhook] Pedido inexistente:', orderId);
          break;
        }

        if (order.status !== 'pending') break; // ya procesado

        const email = (
          session.customer_details?.email ?? session.customer_email ?? order.email
        ).toLowerCase();

        // Alta o actualización del cliente para el historial de compras.
        let customerId: string | null = null;
        const { data: customer } = await db
          .from('customers')
          .upsert(
            {
              store_id: storeId,
              email,
              full_name: session.customer_details?.name ?? null,
              phone: session.customer_details?.phone ?? null,
            },
            { onConflict: 'store_id,email', ignoreDuplicates: false },
          )
          .select('id')
          .maybeSingle();

        customerId = customer?.id ?? null;

        // `shipping_details` vive en `collected_information` en las versiones
        // recientes de la API y en la raíz en las anteriores. Leemos ambas para
        // no depender de la versión fijada en el dashboard del cliente.
        const shipping =
          session.collected_information?.shipping_details ??
          (session as unknown as {
            shipping_details?: { address?: Record<string, unknown>; name?: string };
          }).shipping_details ??
          null;

        await db
          .from('orders')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            email,
            phone: session.customer_details?.phone ?? null,
            customer_id: customerId,
            stripe_payment_intent_id:
              typeof session.payment_intent === 'string'
                ? session.payment_intent
                : session.payment_intent?.id ?? null,
            total_cents: session.amount_total ?? undefined,
            shipping_cents: session.total_details?.amount_shipping ?? 0,
            tax_cents: session.total_details?.amount_tax ?? 0,
            discount_cents: session.total_details?.amount_discount ?? 0,
            shipping_address: shipping?.address
              ? { ...shipping.address, name: shipping.name ?? undefined }
              : null,
          })
          .eq('id', orderId);

        // Descuento atómico e idempotente del inventario.
        const { error: invError } = await db.rpc('apply_order_inventory', {
          p_order_id: orderId,
        });

        if (invError) {
          // El pago es real aunque el inventario falle: el pedido queda pagado
          // y la discrepancia se resuelve desde el panel. Nunca al revés.
          console.error('[webhook] Falló el descuento de inventario:', orderId, invError);
        }

        if (session.metadata?.coupon_code) {
          await db.rpc('increment_coupon_redemption', {
            p_store_id: storeId,
            p_code: session.metadata.coupon_code,
          });
        }
        break;
      }

      // ── Sesión expirada: liberar el pedido pendiente ─────────────────────
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id ?? session.client_reference_id;
        if (!orderId) break;

        await db
          .from('orders')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
          .eq('id', orderId)
          .eq('status', 'pending');
        break;
      }

      // ── Reembolso: devolver stock ────────────────────────────────────────
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId =
          typeof charge.payment_intent === 'string'
            ? charge.payment_intent
            : charge.payment_intent?.id;

        if (!paymentIntentId) break;

        const { data: order } = await db
          .from('orders')
          .select('id, inventory_applied')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .maybeSingle();

        if (!order) break;

        await db
          .from('orders')
          .update({ status: 'refunded' })
          .eq('id', order.id);

        // Solo devolvemos stock en reembolso total: uno parcial puede ser por
        // envío o por una sola línea, y adivinar cuál sería peor que no tocar.
        if (!charge.amount_refunded || charge.amount_refunded === charge.amount) {
          if (order.inventory_applied) {
            await db.rpc('restore_order_inventory', {
              p_order_id: order.id,
              p_reason: 'return',
            });
          }
        }
        break;
      }

      // ── Estado de la cuenta conectada del cliente ────────────────────────
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;

        await db
          .from('stores')
          .update({
            stripe_charges_enabled: account.charges_enabled ?? false,
            stripe_payouts_enabled: account.payouts_enabled ?? false,
            ...(account.charges_enabled ? { stripe_onboarded_at: new Date().toISOString() } : {}),
          })
          .eq('stripe_account_id', account.id);
        break;
      }

      // La cuenta se desconectó de la plataforma: dejamos de poder cobrar.
      case 'account.application.deauthorized': {
        if (event.account) {
          await db
            .from('stores')
            .update({
              stripe_account_id: null,
              stripe_charges_enabled: false,
              stripe_payouts_enabled: false,
            })
            .eq('stripe_account_id', event.account);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error(`[webhook] Error procesando ${event.type}:`, err);
    // 500 => Stripe reintenta. Correcto para fallos transitorios (red, BD).
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
