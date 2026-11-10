import Link from 'next/link';
import { AlertTriangle, History } from 'lucide-react';

import { StockAdjuster } from '@/components/admin/stock-adjuster';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

type SearchParams = Promise<{ filtro?: string }>;

const REASON_LABEL: Record<string, string> = {
  sale: 'Venta',
  restock: 'Reposición',
  adjustment: 'Ajuste',
  return: 'Devolución',
  cancellation: 'Cancelación',
  initial: 'Stock inicial',
};

export default async function InventoryPage({ searchParams }: { searchParams: SearchParams }) {
  const { store } = await requireAdmin();
  const { filtro } = await searchParams;
  const supabase = await createClient();

  const [variantsRes, movementsRes] = await Promise.all([
    supabase
      .from('product_variants')
      .select(`
        id, name, sku, stock, low_stock_threshold, is_active,
        product:products!inner(id, name, slug, status, track_inventory, low_stock_threshold)
      `)
      .eq('store_id', store.id)
      .eq('is_active', true)
      .order('stock', { ascending: true })
      .limit(200),
    supabase
      .from('inventory_movements')
      .select(`
        id, delta, stock_after, reason, note, created_at,
        variant:product_variants(name, product:products(name))
      `)
      .eq('store_id', store.id)
      .order('created_at', { ascending: false })
      .limit(15),
  ]);

  type VariantRow = {
    id: string; name: string; sku: string | null; stock: number;
    low_stock_threshold: number | null;
    product: {
      id: string; name: string; slug: string; status: string;
      track_inventory: boolean; low_stock_threshold: number | null;
    };
  };

  const all = (variantsRes.data ?? []) as unknown as VariantRow[];

  // El umbral efectivo refleja la misma cascada que usa el trigger de la base:
  // variante → producto → tienda.
  const rows = all
    .filter((v) => v.product?.track_inventory)
    .map((v) => {
      const threshold =
        v.low_stock_threshold ?? v.product.low_stock_threshold ?? store.low_stock_threshold;
      return { ...v, threshold, isLow: v.stock <= threshold };
    });

  const lowRows = rows.filter((r) => r.isLow);
  const visible = filtro === 'bajo' ? lowRows : rows;

  type MovementRow = {
    id: string; delta: number; stock_after: number; reason: string;
    note: string | null; created_at: string;
    variant: { name: string; product: { name: string } | null } | null;
  };
  const movements = (movementsRes.data ?? []) as unknown as MovementRow[];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Inventario</h1>
          <p className="mt-1 text-sm text-ink-mute">
            {rows.length} presentaciones con control de existencias
          </p>
        </div>

        <div className="flex gap-1.5">
          <Link
            href="/admin/inventario"
            className={`border px-4 py-2 text-xs ${
              filtro !== 'bajo' ? 'border-ink bg-ink text-cream' : 'border-line text-ink-mute hover:border-ink'
            }`}
          >
            Todo
          </Link>
          <Link
            href="/admin/inventario?filtro=bajo"
            className={`flex items-center gap-2 border px-4 py-2 text-xs ${
              filtro === 'bajo' ? 'border-ink bg-ink text-cream' : 'border-line text-ink-mute hover:border-ink'
            }`}
          >
            Stock bajo
            {lowRows.length > 0 && (
              <span className="rounded-full bg-[#A87A1E] px-1.5 text-[0.65rem] font-semibold text-white">
                {lowRows.length}
              </span>
            )}
          </Link>
        </div>
      </header>

      {lowRows.length > 0 && filtro !== 'bajo' && (
        <div className="flex items-start gap-3 border-l-2 border-[#A87A1E] bg-[#A87A1E]/10 px-5 py-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#A87A1E]" strokeWidth={1.6} aria-hidden />
          <div className="text-sm">
            <p className="font-medium">
              {lowRows.length} producto{lowRows.length === 1 ? '' : 's'} por debajo de su umbral
            </p>
            <p className="mt-0.5 text-xs text-ink-mute">
              Repón pronto para no perder ventas.{' '}
              <Link href="/admin/inventario?filtro=bajo" className="underline">Ver cuáles</Link>
            </p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto border border-line/60 bg-white">
        <table className="w-full min-w-[44rem] text-sm">
          <thead className="border-b border-line/60 bg-cream-deep/40 text-left">
            <tr className="text-[0.7rem] uppercase tracking-wide text-ink-mute">
              <th scope="col" className="px-5 py-3 font-medium">Producto</th>
              <th scope="col" className="px-5 py-3 font-medium">SKU</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">Stock</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">Umbral</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">Ajustar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/40">
            {visible.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center text-sm text-ink-mute">
                  {filtro === 'bajo'
                    ? 'Ningún producto está por debajo de su umbral. Todo en orden.'
                    : 'No hay productos con control de inventario.'}
                </td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr key={row.id} className={row.isLow ? 'bg-[#A87A1E]/[0.06]' : ''}>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/productos/${row.product.id}`}
                      className="font-medium hover:text-gold-deep"
                    >
                      {row.product.name}
                    </Link>
                    {row.name !== 'Única' && (
                      <span className="ml-2 text-xs text-ink-mute">{row.name}</span>
                    )}
                    {row.product.status !== 'active' && (
                      <span className="ml-2 text-[0.7rem] text-ink-mute">(no publicado)</span>
                    )}
                  </td>

                  <td className="px-5 py-3 font-mono text-xs text-ink-mute">{row.sku ?? '—'}</td>

                  <td className="px-5 py-3 text-right">
                    <span
                      className={`text-base font-medium tabular-nums ${
                        row.stock <= 0 ? 'text-red-700' : row.isLow ? 'text-[#A87A1E]' : ''
                      }`}
                    >
                      {row.stock}
                    </span>
                    {row.stock < 0 && (
                      <span className="ml-2 text-[0.7rem] text-red-700">sobreventa</span>
                    )}
                  </td>

                  <td className="px-5 py-3 text-right text-xs tabular-nums text-ink-mute">
                    {row.threshold}
                  </td>

                  <td className="px-5 py-3">
                    <StockAdjuster variantId={row.id} current={row.stock} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Bitácora ─────────────────────────────────────────────────────── */}
      <section className="border border-line/60 bg-white">
        <div className="flex items-center gap-2 border-b border-line/50 px-6 py-4">
          <History className="h-4 w-4 text-ink-mute" strokeWidth={1.5} aria-hidden />
          <h2 className="font-display text-lg">Movimientos recientes</h2>
        </div>

        {movements.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-ink-mute">
            Todavía no hay movimientos de inventario.
          </p>
        ) : (
          <ul className="divide-y divide-line/40">
            {movements.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-4 px-6 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm">
                    {m.variant?.product?.name ?? 'Producto eliminado'}
                    {m.variant?.name && m.variant.name !== 'Única' && (
                      <span className="text-ink-mute"> · {m.variant.name}</span>
                    )}
                  </p>
                  <p className="text-xs text-ink-mute">
                    {REASON_LABEL[m.reason] ?? m.reason}
                    {m.note && ` · ${m.note}`}
                    {' · '}
                    {new Date(m.created_at).toLocaleString(store.locale, {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className={`text-sm font-medium tabular-nums ${
                      m.delta > 0 ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {m.delta > 0 ? '+' : ''}{m.delta}
                  </span>
                  <p className="text-xs tabular-nums text-ink-mute">queda {m.stock_after}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
