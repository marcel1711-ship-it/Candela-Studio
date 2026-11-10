import Link from 'next/link';

import { SalesChart, type SalesPoint } from '@/components/admin/sales-chart';
import { StatTile } from '@/components/admin/stat-tile';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatMoney, percentChange } from '@/lib/money';
import type { DashboardMetrics } from '@/lib/types';

type SearchParams = Promise<{ dias?: string }>;

const RANGES = [
  { value: 7, label: '7 días' },
  { value: 30, label: '30 días' },
  { value: 90, label: '90 días' },
];

export default async function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const { store } = await requireAdmin();
  const { dias } = await searchParams;

  const days = RANGES.some((r) => r.value === Number(dias)) ? Number(dias) : 30;
  const supabase = await createClient();

  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const [metricsRes, seriesRes, itemsRes] = await Promise.all([
    supabase.rpc('store_dashboard', { p_store_id: store.id, p_days: days }),
    supabase.rpc('store_sales_series', { p_store_id: store.id, p_days: days }),
    supabase
      .from('order_items')
      .select('product_name, variant_name, quantity, total_cents, order:orders!inner(status, paid_at)')
      .eq('store_id', store.id)
      .in('order.status', ['paid', 'fulfilled'])
      .gte('order.paid_at', since)
      .limit(1000),
  ]);

  const m = (metricsRes.data ?? {}) as Partial<DashboardMetrics>;
  const series = (seriesRes.data ?? []) as SalesPoint[];
  const money = (c: number) => formatMoney(c, store.currency, store.locale);

  // Top productos: lo agregamos en memoria porque mil líneas es poco y evita
  // otra función en la base. Si un cliente crece, esto se vuelve una vista.
  type ItemRow = { product_name: string; quantity: number; total_cents: number };
  const totals = new Map<string, { units: number; revenue: number }>();

  for (const row of (itemsRes.data ?? []) as unknown as ItemRow[]) {
    const prev = totals.get(row.product_name) ?? { units: 0, revenue: 0 };
    totals.set(row.product_name, {
      units: prev.units + row.quantity,
      revenue: prev.revenue + row.total_cents,
    });
  }

  const top = [...totals.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const maxRevenue = top[0]?.revenue ?? 1;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Reportes</h1>
          <p className="mt-1 text-sm text-ink-mute">Cómo van tus ventas</p>
        </div>

        <div className="flex gap-1.5">
          {RANGES.map((r) => (
            <Link
              key={r.value}
              href={`/admin/reportes?dias=${r.value}`}
              className={`border px-4 py-2 text-xs ${
                days === r.value
                  ? 'border-ink bg-ink text-cream'
                  : 'border-line text-ink-mute hover:border-ink'
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Ingresos"
          value={money(m.revenue_cents ?? 0)}
          change={percentChange(m.revenue_cents ?? 0, m.revenue_prev_cents ?? 0)}
        />
        <StatTile
          label="Pedidos"
          value={String(m.orders ?? 0)}
          change={percentChange(m.orders ?? 0, m.orders_prev ?? 0)}
        />
        <StatTile label="Ticket promedio" value={money(m.aov_cents ?? 0)} />
        <StatTile label="Clientes" value={String(m.customers ?? 0)} />
      </section>

      <SalesChart data={series} currency={store.currency} locale={store.locale} />

      <section className="border border-line/60 bg-white">
        <h2 className="border-b border-line/50 px-6 py-4 font-display text-lg">
          Productos más vendidos
        </h2>

        {top.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm text-ink-mute">
            Aún no hay ventas en este periodo.
          </p>
        ) : (
          <ul className="divide-y divide-line/40">
            {top.map((item, i) => (
              <li key={item.name} className="px-6 py-3.5">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="min-w-0 truncate text-sm">
                    <span className="mr-2 tabular-nums text-ink-mute">{i + 1}.</span>
                    {item.name}
                  </span>
                  <span className="shrink-0 text-sm tabular-nums">{money(item.revenue)}</span>
                </div>

                {/* Barra de proporción: una sola serie, sin leyenda. */}
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1.5 flex-1 bg-cream-deep">
                    <div
                      className="h-full rounded-r-[2px]"
                      style={{
                        width: `${(item.revenue / maxRevenue) * 100}%`,
                        backgroundColor: '#A87A1E',
                      }}
                    />
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-ink-mute">
                    {item.units} u.
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
