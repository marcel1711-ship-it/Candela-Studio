import { Tag } from 'lucide-react';

import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatMoney } from '@/lib/money';
import { CouponForm } from '@/components/admin/coupon-form';

export default async function CouponsPage() {
  const { store } = await requireAdmin();
  const supabase = await createClient();

  const { data: coupons } = await supabase
    .from('coupons')
    .select('*')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <h1 className="font-display text-3xl">Promociones</h1>
        <p className="mt-1 text-sm text-ink-mute">
          Códigos de descuento que tus clientes aplican al pagar.
        </p>
      </header>

      <CouponForm currency={store.currency} />

      <section className="border border-line/60 bg-white">
        <h2 className="border-b border-line/50 px-6 py-4 font-display text-lg">
          Cupones activos
        </h2>

        {!coupons || coupons.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Tag className="mx-auto h-9 w-9 text-line" strokeWidth={1} aria-hidden />
            <p className="mt-3 text-sm text-ink-mute">Todavía no has creado cupones.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="border-b border-line/60 bg-cream-deep/40 text-left">
                <tr className="text-[0.7rem] uppercase tracking-wide text-ink-mute">
                  <th scope="col" className="px-6 py-3 font-medium">Código</th>
                  <th scope="col" className="px-6 py-3 font-medium">Descuento</th>
                  <th scope="col" className="px-6 py-3 font-medium">Mínimo</th>
                  <th scope="col" className="px-6 py-3 text-right font-medium">Usos</th>
                  <th scope="col" className="px-6 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {coupons.map((c) => {
                  const expired = c.ends_at && new Date(c.ends_at) < new Date();
                  const exhausted =
                    c.max_redemptions !== null && c.times_redeemed >= c.max_redemptions;
                  const live = c.is_active && !expired && !exhausted;

                  return (
                    <tr key={c.id}>
                      <td className="px-6 py-3 font-mono text-xs font-semibold">{c.code}</td>
                      <td className="px-6 py-3">
                        {c.type === 'percent'
                          ? `${c.value}%`
                          : formatMoney(c.value, store.currency, store.locale)}
                      </td>
                      <td className="px-6 py-3 tabular-nums text-ink-mute">
                        {c.min_subtotal_cents > 0
                          ? formatMoney(c.min_subtotal_cents, store.currency, store.locale)
                          : '—'}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums">
                        {c.times_redeemed}
                        {c.max_redemptions !== null && (
                          <span className="text-ink-mute"> / {c.max_redemptions}</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`border px-2 py-1 text-[0.7rem] ${
                            live
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                              : 'border-line bg-cream-deep text-ink-mute'
                          }`}
                        >
                          {live ? 'Activo' : expired ? 'Vencido' : exhausted ? 'Agotado' : 'Pausado'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
