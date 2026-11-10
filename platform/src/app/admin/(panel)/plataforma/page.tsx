import Link from 'next/link';
import { AlertTriangle, Building2, CheckCircle2, CreditCard, PauseCircle } from 'lucide-react';

import { NewStoreForm } from '@/components/admin/new-store-form';
import { StoreStatusControl } from '@/components/admin/store-status-control';
import { requirePlatformAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatMoney } from '@/lib/money';
import type { Store } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function PlatformPage() {
  await requirePlatformAdmin();
  const db = createAdminClient();

  const { data: storeRows } = await db.from('stores').select('*').order('created_at');
  const stores = (storeRows ?? []) as Store[];

  // Métricas de los últimos 30 días para todas las tiendas, en una consulta.
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [ordersRes, membersRes, alertsRes] = await Promise.all([
    db
      .from('orders')
      .select('store_id, total_cents, status, fulfillment_status')
      .in('status', ['paid', 'fulfilled'])
      .gte('paid_at', since),
    db.from('store_members').select('store_id, role, user:profiles(email)'),
    db.from('stock_alerts').select('store_id').in('status', ['open', 'notified']),
  ]);

  type OrderRow = { store_id: string; total_cents: number; fulfillment_status: string };
  type MemberRow = { store_id: string; role: string; user: { email: string | null } | null };

  const byStore = new Map<string, { revenue: number; orders: number; pending: number }>();
  for (const o of (ordersRes.data ?? []) as OrderRow[]) {
    const cur = byStore.get(o.store_id) ?? { revenue: 0, orders: 0, pending: 0 };
    cur.revenue += o.total_cents;
    cur.orders += 1;
    if (o.fulfillment_status === 'unfulfilled') cur.pending += 1;
    byStore.set(o.store_id, cur);
  }

  const owners = new Map<string, string[]>();
  for (const m of (membersRes.data ?? []) as unknown as MemberRow[]) {
    if (m.role !== 'owner' || !m.user?.email) continue;
    owners.set(m.store_id, [...(owners.get(m.store_id) ?? []), m.user.email]);
  }

  const alertCount = new Map<string, number>();
  for (const a of (alertsRes.data ?? []) as { store_id: string }[]) {
    alertCount.set(a.store_id, (alertCount.get(a.store_id) ?? 0) + 1);
  }

  const totalRevenue = [...byStore.values()].reduce((n, v) => n + v.revenue, 0);
  const live = stores.filter((s) => s.status === 'active').length;

  // Lo que Candela factura por comisión, sobre lo vendido en el periodo.
  const platformEarnings = stores.reduce((sum, s) => {
    const rev = byStore.get(s.id)?.revenue ?? 0;
    return sum + Math.floor((rev * s.platform_fee_bps) / 10_000);
  }, 0);

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Solo equipo Candela</p>
        <h1 className="mt-2 font-display text-3xl">Plataforma</h1>
        <p className="mt-1 text-sm text-ink-mute">
          {stores.length} tienda{stores.length === 1 ? '' : 's'} · {live} publicada
          {live === 1 ? '' : 's'}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="border border-line/60 bg-white p-5">
          <p className="text-[0.7rem] uppercase tracking-wideish text-ink-mute">
            Vendido por tus clientes
          </p>
          <p className="mt-2 font-display text-3xl tabular-nums">
            {formatMoney(totalRevenue)}
          </p>
          <p className="mt-1 text-xs text-ink-mute">últimos 30 días, todas las tiendas</p>
        </div>

        <div className="border border-line/60 bg-white p-5">
          <p className="text-[0.7rem] uppercase tracking-wideish text-ink-mute">
            Tu comisión
          </p>
          <p className="mt-2 font-display text-3xl tabular-nums text-[#A87A1E]">
            {formatMoney(platformEarnings)}
          </p>
          <p className="mt-1 text-xs text-ink-mute">
            vía Stripe Connect, mismo periodo
          </p>
        </div>

        <div className="border border-line/60 bg-white p-5">
          <p className="text-[0.7rem] uppercase tracking-wideish text-ink-mute">
            Sin cobrar todavía
          </p>
          <p className="mt-2 font-display text-3xl tabular-nums">
            {stores.filter((s) => !s.stripe_charges_enabled).length}
          </p>
          <p className="mt-1 text-xs text-ink-mute">tiendas sin Stripe activo</p>
        </div>
      </section>

      <NewStoreForm />

      <section className="border border-line/60 bg-white">
        <h2 className="border-b border-line/50 px-6 py-4 font-display text-lg">
          Todas las tiendas
        </h2>

        {stores.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Building2 className="mx-auto h-10 w-10 text-line" strokeWidth={1} aria-hidden />
            <p className="mt-3 text-sm text-ink-mute">Todavía no hay tiendas.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line/40">
            {stores.map((store) => {
              const m = byStore.get(store.id) ?? { revenue: 0, orders: 0, pending: 0 };
              const alerts = alertCount.get(store.id) ?? 0;
              const storeOwners = owners.get(store.id) ?? [];

              return (
                <li key={store.id} className="px-6 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="font-display text-lg">{store.name}</h3>

                        <span
                          className={`border px-2 py-0.5 text-[0.7rem] ${
                            store.status === 'active'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                              : store.status === 'draft'
                                ? 'border-line bg-cream-deep text-ink-mute'
                                : 'border-red-200 bg-red-50 text-red-800'
                          }`}
                        >
                          {store.status === 'active'
                            ? 'Publicada'
                            : store.status === 'draft'
                              ? 'Borrador'
                              : 'Suspendida'}
                        </span>

                        {store.stripe_charges_enabled ? (
                          <span className="flex items-center gap-1 text-[0.7rem] text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
                            Stripe activo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[0.7rem] text-[#A87A1E]">
                            <CreditCard className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden />
                            Sin cobrar
                          </span>
                        )}

                        {alerts > 0 && (
                          <span className="flex items-center gap-1 text-[0.7rem] text-[#A87A1E]">
                            <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden />
                            {alerts} con stock bajo
                          </span>
                        )}
                      </div>

                      <p className="mt-1 font-mono text-xs text-ink-mute">
                        {store.slug}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'wearecandela.com'}
                      </p>

                      {storeOwners.length > 0 && (
                        <p className="mt-0.5 text-xs text-ink-mute">
                          Dueño: {storeOwners.join(', ')}
                        </p>
                      )}

                      {store.platform_fee_bps > 0 && (
                        <p className="mt-0.5 text-xs text-ink-mute">
                          Comisión {(store.platform_fee_bps / 100).toFixed(2)}% ·
                          {' '}te generó {formatMoney(Math.floor((m.revenue * store.platform_fee_bps) / 10_000))}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <p className="text-[0.7rem] uppercase tracking-wide text-ink-mute">
                          30 días
                        </p>
                        <p className="font-display text-xl tabular-nums">
                          {formatMoney(m.revenue, store.currency)}
                        </p>
                        <p className="text-xs tabular-nums text-ink-mute">
                          {m.orders} pedido{m.orders === 1 ? '' : 's'}
                          {m.pending > 0 && ` · ${m.pending} por enviar`}
                        </p>
                      </div>

                      <StoreStatusControl storeId={store.id} status={store.status} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="flex items-start gap-2.5 border-l-2 border-line bg-cream-deep/40 px-5 py-4 text-xs leading-relaxed text-ink-mute">
        <PauseCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.4} aria-hidden />
        <span>
          <strong className="text-ink">Suspender</strong> deja la tienda fuera de
          servicio sin borrar nada: el dueño sigue entrando al panel y reactivar
          es instantáneo. Es la palanca para falta de pago.{' '}
          <Link href="/admin" className="underline">Volver al resumen</Link>
        </span>
      </p>
    </div>
  );
}
