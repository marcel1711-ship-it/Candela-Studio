import Link from 'next/link';
import { PackageX } from 'lucide-react';

import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatMoney } from '@/lib/money';
import { OrderStatusBadge } from '@/components/admin/order-status-badge';

type SearchParams = Promise<{ estado?: string }>;

const FILTERS = [
  { value: 'todos', label: 'Todos' },
  { value: 'por-enviar', label: 'Por enviar' },
  { value: 'fulfilled', label: 'Enviados' },
  { value: 'pending', label: 'Sin pagar' },
  { value: 'cancelled', label: 'Cancelados' },
];

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const { store } = await requireAdmin();
  const { estado = 'todos' } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('orders')
    .select('id, order_number, email, total_cents, status, fulfillment_status, placed_at, currency')
    .eq('store_id', store.id)
    .order('placed_at', { ascending: false })
    .limit(100);

  if (estado === 'por-enviar') {
    query = query.eq('status', 'paid').eq('fulfillment_status', 'unfulfilled');
  } else if (estado !== 'todos') {
    query = query.eq('status', estado);
  }

  const { data: orders } = await query;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl">Pedidos</h1>
        <p className="mt-1 text-sm text-ink-mute">
          {orders?.length ?? 0} pedido{orders?.length === 1 ? '' : 's'}
        </p>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/admin/pedidos?estado=${f.value}`}
            className={`border px-4 py-2 text-xs transition-colors ${
              estado === f.value
                ? 'border-ink bg-ink text-cream'
                : 'border-line text-ink-mute hover:border-ink'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {!orders || orders.length === 0 ? (
        <div className="border border-line/60 bg-white px-6 py-20 text-center">
          <PackageX className="mx-auto h-10 w-10 text-line" strokeWidth={1} aria-hidden />
          <h2 className="mt-4 font-display text-xl">Sin pedidos aquí</h2>
          <p className="mt-2 text-sm text-ink-mute">
            Cuando lleguen ventas aparecerán en esta lista.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-line/60 bg-white">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="border-b border-line/60 bg-cream-deep/40 text-left">
              <tr className="text-[0.7rem] uppercase tracking-wide text-ink-mute">
                <th scope="col" className="px-5 py-3 font-medium">Pedido</th>
                <th scope="col" className="px-5 py-3 font-medium">Cliente</th>
                <th scope="col" className="px-5 py-3 font-medium">Fecha</th>
                <th scope="col" className="px-5 py-3 font-medium">Estado</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-cream-deep/20">
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className="font-medium tabular-nums hover:text-gold-deep"
                    >
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="max-w-[14rem] truncate px-5 py-3 text-ink-mute">{order.email}</td>
                  <td className="px-5 py-3 text-xs text-ink-mute">
                    {new Date(order.placed_at).toLocaleDateString(store.locale, {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-3">
                    <OrderStatusBadge
                      status={order.status}
                      fulfillment={order.fulfillment_status}
                    />
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {formatMoney(order.total_cents, order.currency, store.locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
