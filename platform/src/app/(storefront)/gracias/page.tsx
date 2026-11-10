import Link from 'next/link';
import { CheckCircle2, Package } from 'lucide-react';

import { createAdminClient } from '@/lib/supabase/admin';
import { formatMoney } from '@/lib/money';
import { requireStore } from '@/lib/tenant';
import { ClearCart } from '@/components/storefront/clear-cart';
import type { OrderItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ session_id?: string }>;

export default async function ThankYouPage({ searchParams }: { searchParams: SearchParams }) {
  const { session_id } = await searchParams;
  const store = await requireStore();

  const db = createAdminClient();

  // Buscamos por session_id Y store_id: sin el segundo filtro, pegar el
  // session_id de otra tienda mostraría su pedido.
  const { data: order } = session_id
    ? await db
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('store_id', store.id)
        .eq('stripe_checkout_session_id', session_id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <ClearCart storeId={store.id} />

      <CheckCircle2 className="mx-auto h-14 w-14 text-gold-deep" strokeWidth={1} aria-hidden />

      <h1 className="mt-6 font-display text-4xl">¡Gracias por tu compra!</h1>

      {order ? (
        <>
          <p className="mt-4 text-ink-mute">
            Recibimos tu pedido{' '}
            <strong className="font-medium text-ink">{order.order_number}</strong>. Te enviamos
            la confirmación a <strong className="font-medium text-ink">{order.email}</strong>.
          </p>

          <div className="mt-10 border border-line/60 bg-white text-left">
            <div className="flex items-center gap-2 border-b border-line/50 px-6 py-4">
              <Package className="h-4 w-4 text-ink-mute" strokeWidth={1.4} aria-hidden />
              <h2 className="font-display text-lg">Resumen</h2>
            </div>

            <ul className="divide-y divide-line/40 px-6">
              {((order.items ?? []) as OrderItem[]).map((item) => (
                <li key={item.id} className="flex justify-between gap-4 py-4 text-sm">
                  <span>
                    {item.product_name}
                    {item.variant_name && item.variant_name !== 'Única' && (
                      <span className="text-ink-mute"> · {item.variant_name}</span>
                    )}
                    <span className="text-ink-mute"> × {item.quantity}</span>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {formatMoney(item.total_cents, order.currency, store.locale)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="space-y-2 border-t border-line/50 px-6 py-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-mute">Subtotal</dt>
                <dd className="tabular-nums">
                  {formatMoney(order.subtotal_cents, order.currency, store.locale)}
                </dd>
              </div>
              {order.discount_cents > 0 && (
                <div className="flex justify-between text-gold-deep">
                  <dt>Descuento{order.coupon_code ? ` (${order.coupon_code})` : ''}</dt>
                  <dd className="tabular-nums">
                    −{formatMoney(order.discount_cents, order.currency, store.locale)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-mute">Envío</dt>
                <dd className="tabular-nums">
                  {order.shipping_cents > 0
                    ? formatMoney(order.shipping_cents, order.currency, store.locale)
                    : 'Gratis'}
                </dd>
              </div>
              {order.tax_cents > 0 && (
                <div className="flex justify-between">
                  <dt className="text-ink-mute">Impuestos</dt>
                  <dd className="tabular-nums">
                    {formatMoney(order.tax_cents, order.currency, store.locale)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between border-t border-line/50 pt-3 font-display text-lg">
                <dt>Total</dt>
                <dd className="tabular-nums">
                  {formatMoney(order.total_cents, order.currency, store.locale)}
                </dd>
              </div>
            </dl>
          </div>
        </>
      ) : (
        // El webhook puede tardar unos segundos. No es un error: no alarmamos.
        <p className="mt-4 text-ink-mute">
          Tu pago se está confirmando. En menos de un minuto recibirás el correo
          con el detalle de tu pedido.
        </p>
      )}

      <Link href="/tienda" className="btn-outline mt-10">
        Seguir comprando
      </Link>
    </div>
  );
}
