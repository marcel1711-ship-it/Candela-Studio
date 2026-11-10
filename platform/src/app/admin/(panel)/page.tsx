import Link from 'next/link';
import { AlertTriangle, ArrowRight, PackageX, Share2 } from 'lucide-react';

import { StatTile } from '@/components/admin/stat-tile';
import { SalesChart, type SalesPoint } from '@/components/admin/sales-chart';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatMoney, percentChange } from '@/lib/money';
import type { DashboardMetrics } from '@/lib/types';

export default async function DashboardPage() {
  const { store } = await requireAdmin();
  const supabase = await createClient();

  const [metricsRes, seriesRes, channelsRes, alertsRes, ordersRes] = await Promise.all([
    supabase.rpc('store_dashboard', { p_store_id: store.id, p_days: 30 }),
    supabase.rpc('store_sales_series', { p_store_id: store.id, p_days: 30 }),
    supabase.rpc('store_sales_by_channel', { p_store_id: store.id, p_days: 30 }),
    supabase
      .from('stock_alerts')
      .select(`
        id, threshold, stock_at_alert, created_at,
        variant:product_variants(id, name, stock, sku, product:products(name, slug))
      `)
      .eq('store_id', store.id)
      .in('status', ['open', 'notified'])
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('orders')
      .select('id, order_number, email, total_cents, status, fulfillment_status, placed_at')
      .eq('store_id', store.id)
      .in('status', ['paid', 'fulfilled', 'refunded'])
      .order('placed_at', { ascending: false })
      .limit(6),
  ]);

  const m = (metricsRes.data ?? {}) as Partial<DashboardMetrics>;
  const series = (seriesRes.data ?? []) as SalesPoint[];

  type AlertRow = {
    id: string; threshold: number; stock_at_alert: number;
    variant: { id: string; name: string; stock: number; sku: string | null;
               product: { name: string; slug: string } | null } | null;
  };
  const alerts = (alertsRes.data ?? []) as unknown as AlertRow[];
  const orders = ordersRes.data ?? [];

  type ChannelRow = {
    channel_id: string; channel_name: string;
    revenue_cents: number; orders: number; units: number;
  };
  const channels = (channelsRes.data ?? []) as ChannelRow[];
  const channelTotal = channels.reduce((n, c) => n + Number(c.revenue_cents), 0);

  const revenue = m.revenue_cents ?? 0;
  const money = (c: number) => formatMoney(c, store.currency, store.locale);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Resumen</h1>
          <p className="mt-1 text-sm text-ink-mute">
            {store.name} · últimos 30 días
          </p>
        </div>

        {!store.stripe_charges_enabled && (
          <Link
            href="/admin/configuracion#pagos"
            className="flex items-center gap-2 border-l-2 border-[#A87A1E] bg-[#A87A1E]/10 px-4 py-2.5 text-xs text-ink"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#A87A1E]" strokeWidth={1.6} aria-hidden />
            Conecta Stripe para poder cobrar
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        )}
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Ventas"
          value={money(revenue)}
          change={percentChange(revenue, m.revenue_prev_cents ?? 0)}
        />
        <StatTile
          label="Pedidos"
          value={String(m.orders ?? 0)}
          change={percentChange(m.orders ?? 0, m.orders_prev ?? 0)}
        />
        <StatTile
          label="Ticket promedio"
          value={money(m.aov_cents ?? 0)}
          hint={`${m.customers ?? 0} clientes registrados`}
        />
        <StatTile
          label="Por enviar"
          value={String(m.pending ?? 0)}
          hint={`${m.products ?? 0} productos activos`}
          tone="warn"
        />
      </section>

      <SalesChart data={series} currency={store.currency} locale={store.locale} />

      {/* Desglose por canal: solo aparece si de verdad vende en más de uno.
          Con un solo canal sería una barra al 100%, que no dice nada. */}
      {channels.length > 1 && channelTotal > 0 && (
        <section className="border border-line/60 bg-white">
          <div className="flex items-center justify-between border-b border-line/50 px-6 py-4">
            <h2 className="flex items-center gap-2 font-display text-lg">
              <Share2 className="h-4 w-4 text-ink-mute" strokeWidth={1.5} aria-hidden />
              Ventas por canal
            </h2>
            <Link href="/admin/canales" className="text-xs text-ink-mute hover:text-ink">
              Importar y conciliar <span aria-hidden>→</span>
            </Link>
          </div>

          <ul className="divide-y divide-line/40">
            {channels
              .filter((c) => Number(c.revenue_cents) > 0)
              .map((c) => {
                const pct = (Number(c.revenue_cents) / channelTotal) * 100;
                return (
                  <li key={c.channel_id} className="px-6 py-3.5">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-sm">{c.channel_name}</span>
                      <span className="text-sm tabular-nums">{money(Number(c.revenue_cents))}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-1.5 flex-1 bg-cream-deep">
                        <div
                          className="h-full rounded-r-[2px]"
                          style={{ width: `${pct}%`, backgroundColor: '#A87A1E' }}
                        />
                      </div>
                      <span className="shrink-0 text-xs tabular-nums text-ink-mute">
                        {c.units} u. · {pct.toFixed(0)}%
                      </span>
                    </div>
                  </li>
                );
              })}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Stock bajo ──────────────────────────────────────────────────── */}
        <section className="border border-line/60 bg-white">
          <div className="flex items-center justify-between border-b border-line/50 px-6 py-4">
            <h2 className="flex items-center gap-2 font-display text-lg">
              Stock bajo
              {alerts.length > 0 && (
                <span className="rounded-full bg-[#A87A1E] px-2 py-0.5 text-[0.7rem] font-sans font-semibold text-white">
                  {alerts.length}
                </span>
              )}
            </h2>
            <Link href="/admin/inventario" className="text-xs text-ink-mute hover:text-ink">
              Ver todo <span aria-hidden>→</span>
            </Link>
          </div>

          {alerts.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-ink-mute">
              Todo en orden. Ningún producto bajo su umbral.
            </p>
          ) : (
            <ul className="divide-y divide-line/40">
              {alerts.map((alert) => (
                <li key={alert.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      {alert.variant?.product?.name ?? 'Producto eliminado'}
                    </p>
                    <p className="text-xs text-ink-mute">
                      {alert.variant?.name !== 'Única' && `${alert.variant?.name} · `}
                      umbral {alert.threshold}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-medium tabular-nums ${
                      (alert.variant?.stock ?? 0) <= 0 ? 'text-red-700' : 'text-[#A87A1E]'
                    }`}
                  >
                    {alert.variant?.stock ?? 0} u.
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Pedidos recientes ───────────────────────────────────────────── */}
        <section className="border border-line/60 bg-white">
          <div className="flex items-center justify-between border-b border-line/50 px-6 py-4">
            <h2 className="font-display text-lg">Pedidos recientes</h2>
            <Link href="/admin/pedidos" className="text-xs text-ink-mute hover:text-ink">
              Ver todos <span aria-hidden>→</span>
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <PackageX className="mx-auto h-8 w-8 text-line" strokeWidth={1} aria-hidden />
              <p className="mt-3 text-sm text-ink-mute">Todavía no hay pedidos.</p>
            </div>
          ) : (
            <ul className="divide-y divide-line/40">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/pedidos/${order.id}`}
                    className="flex items-center justify-between gap-4 px-6 py-3.5 hover:bg-cream-deep/40"
                  >
                    <div className="min-w-0">
                      <p className="text-sm tabular-nums">{order.order_number}</p>
                      <p className="truncate text-xs text-ink-mute">{order.email}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm tabular-nums">{money(order.total_cents)}</p>
                      <p className="text-xs text-ink-mute">
                        {order.fulfillment_status === 'fulfilled' ? 'Enviado' : 'Por enviar'}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
