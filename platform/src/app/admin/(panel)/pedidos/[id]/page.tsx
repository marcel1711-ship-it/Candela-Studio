import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Mail, MapPin, Phone } from 'lucide-react';

import { OrderStatusBadge } from '@/components/admin/order-status-badge';
import { FulfillPanel } from '@/components/admin/fulfill-panel';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatMoney } from '@/lib/money';
import type { OrderWithItems } from '@/lib/types';

type Params = Promise<{ id: string }>;

export default async function OrderDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const { store } = await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', id)
    .eq('store_id', store.id)
    .maybeSingle();

  if (!data) notFound();

  const order = data as unknown as OrderWithItems;
  const money = (c: number) => formatMoney(c, order.currency, store.locale);
  const address = order.shipping_address;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <nav className="mb-2 text-xs text-ink-mute">
            <Link href="/admin/pedidos" className="hover:text-ink">Pedidos</Link>
            <span className="mx-2" aria-hidden>/</span>
            <span className="text-ink">{order.order_number}</span>
          </nav>

          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl tabular-nums">{order.order_number}</h1>
            <OrderStatusBadge status={order.status} fulfillment={order.fulfillment_status} />
          </div>

          <p className="mt-1 text-sm text-ink-mute">
            {new Date(order.placed_at).toLocaleString(store.locale, {
              dateStyle: 'long', timeStyle: 'short',
            })}
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* ── Artículos ──────────────────────────────────────────────── */}
          <section className="border border-line/60 bg-white">
            <h2 className="border-b border-line/50 px-6 py-4 font-display text-lg">
              Artículos
            </h2>

            <ul className="divide-y divide-line/40">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4 px-6 py-4">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden bg-cream-deep">
                    {item.image_url && (
                      <Image src={item.image_url} alt="" fill sizes="56px" className="object-cover" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.product_name}</p>
                    <p className="text-xs text-ink-mute">
                      {item.variant_name && item.variant_name !== 'Única' && `${item.variant_name} · `}
                      {item.sku && `SKU ${item.sku} · `}
                      {money(item.unit_price_cents)} × {item.quantity}
                    </p>
                  </div>

                  <span className="shrink-0 text-sm tabular-nums">{money(item.total_cents)}</span>
                </li>
              ))}
            </ul>

            <dl className="space-y-2 border-t border-line/50 px-6 py-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-mute">Subtotal</dt>
                <dd className="tabular-nums">{money(order.subtotal_cents)}</dd>
              </div>
              {order.discount_cents > 0 && (
                <div className="flex justify-between text-[#A87A1E]">
                  <dt>Descuento{order.coupon_code ? ` (${order.coupon_code})` : ''}</dt>
                  <dd className="tabular-nums">−{money(order.discount_cents)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-mute">Envío</dt>
                <dd className="tabular-nums">
                  {order.shipping_cents > 0 ? money(order.shipping_cents) : 'Gratis'}
                </dd>
              </div>
              {order.tax_cents > 0 && (
                <div className="flex justify-between">
                  <dt className="text-ink-mute">Impuestos</dt>
                  <dd className="tabular-nums">{money(order.tax_cents)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-line/50 pt-3 font-display text-lg">
                <dt>Total</dt>
                <dd className="tabular-nums">{money(order.total_cents)}</dd>
              </div>
            </dl>
          </section>

          <FulfillPanel order={order} />
        </div>

        {/* ── Cliente y envío ──────────────────────────────────────────── */}
        <div className="space-y-6">
          <section className="border border-line/60 bg-white p-6">
            <h2 className="mb-4 font-display text-lg">Cliente</h2>

            <div className="space-y-2.5 text-sm">
              <a
                href={`mailto:${order.email}`}
                className="flex items-start gap-2.5 break-all hover:text-gold-deep"
              >
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-ink-mute" strokeWidth={1.4} aria-hidden />
                {order.email}
              </a>

              {order.phone && (
                <a
                  href={`tel:${order.phone.replace(/[^0-9+]/g, '')}`}
                  className="flex items-start gap-2.5 hover:text-gold-deep"
                >
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-ink-mute" strokeWidth={1.4} aria-hidden />
                  {order.phone}
                </a>
              )}
            </div>
          </section>

          <section className="border border-line/60 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg">
              <MapPin className="h-4 w-4 text-ink-mute" strokeWidth={1.4} aria-hidden />
              Dirección de envío
            </h2>

            {address ? (
              <address className="space-y-0.5 text-sm not-italic leading-relaxed">
                {address.name && <p className="font-medium">{address.name}</p>}
                {address.line1 && <p>{address.line1}</p>}
                {address.line2 && <p>{address.line2}</p>}
                <p>
                  {[address.city, address.state, address.postal_code].filter(Boolean).join(', ')}
                </p>
                {address.country && <p>{address.country}</p>}
              </address>
            ) : (
              <p className="text-sm text-ink-mute">
                Sin dirección registrada (pedido sin envío o aún sin pagar).
              </p>
            )}
          </section>

          <section className="border border-line/60 bg-white p-6">
            <h2 className="mb-3 font-display text-lg">Pago</h2>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-mute">Estado</dt>
                <dd>{order.paid_at ? 'Pagado' : 'Pendiente'}</dd>
              </div>
              {order.paid_at && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-mute">Fecha</dt>
                  <dd>{new Date(order.paid_at).toLocaleDateString(store.locale)}</dd>
                </div>
              )}
              {order.stripe_payment_intent_id && (
                <div className="flex justify-between gap-3">
                  <dt className="shrink-0 text-ink-mute">Stripe</dt>
                  <dd className="break-all text-right font-mono text-[0.65rem]">
                    {order.stripe_payment_intent_id}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-ink-mute">Inventario</dt>
                <dd>{order.inventory_applied ? 'Descontado' : 'Sin descontar'}</dd>
              </div>
            </dl>

            <p className="mt-4 border-t border-line/40 pt-3 text-[0.7rem] leading-relaxed text-ink-mute">
              Los reembolsos se hacen desde tu panel de Stripe. Al reembolsar ahí,
              este pedido se actualiza solo y el stock regresa.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
