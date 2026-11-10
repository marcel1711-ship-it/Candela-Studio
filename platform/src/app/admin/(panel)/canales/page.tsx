import { Download, History, Store, Undo2 } from 'lucide-react';

import { CsvImporter } from '@/components/admin/csv-importer';
import { ChannelForm } from '@/components/admin/channel-form';
import { RevertBatchButton } from '@/components/admin/revert-batch-button';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatMoney } from '@/lib/money';

export const dynamic = 'force-dynamic';

const CHANNEL_LABEL: Record<string, string> = {
  web: 'Tienda en línea',
  amazon: 'Amazon',
  walmart: 'Walmart',
  tiktok: 'TikTok Shop',
  etsy: 'Etsy',
  ebay: 'eBay',
  mercadolibre: 'Mercado Libre',
  otro: 'Otro',
};

export default async function ChannelsPage() {
  const { store } = await requireAdmin();
  const supabase = await createClient();

  const [channelsRes, salesRes, batchesRes] = await Promise.all([
    supabase
      .from('sales_channels')
      .select('*')
      .eq('store_id', store.id)
      .order('created_at'),
    supabase.rpc('store_sales_by_channel', { p_store_id: store.id, p_days: 30 }),
    supabase
      .from('import_batches')
      .select('*, channel:sales_channels(name, type)')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  type Channel = {
    id: string; type: string; name: string; is_active: boolean;
    stock_buffer: number; csv_mapping: Record<string, Record<string, string>>;
  };
  type SalesRow = {
    channel_id: string; channel_type: string; channel_name: string;
    revenue_cents: number; orders: number; units: number;
  };
  type Batch = {
    id: string; kind: string; filename: string | null; rows_total: number;
    rows_imported: number; rows_skipped: number; rows_failed: number;
    status: string; created_at: string;
    channel: { name: string; type: string } | null;
  };

  const channels = (channelsRes.data ?? []) as Channel[];
  const sales = (salesRes.data ?? []) as SalesRow[];
  const batches = (batchesRes.data ?? []) as unknown as Batch[];

  const salesByChannel = new Map(sales.map((s) => [s.channel_id, s]));
  const totalRevenue = sales.reduce((n, s) => n + Number(s.revenue_cents), 0);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl">Canales de venta</h1>
        <p className="mt-1 text-sm text-ink-mute">
          Un solo inventario para tu tienda y tus marketplaces.
        </p>
      </header>

      {/* ── Qué vendiste y dónde ───────────────────────────────────────── */}
      <section className="border border-line/60 bg-white">
        <div className="flex items-baseline justify-between border-b border-line/50 px-6 py-4">
          <h2 className="font-display text-lg">Ventas por canal</h2>
          <span className="text-xs text-ink-mute">últimos 30 días</span>
        </div>

        {totalRevenue === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-ink-mute">
            Todavía no hay ventas registradas. Importa un reporte para verlas aquí.
          </p>
        ) : (
          <ul className="divide-y divide-line/40">
            {sales.map((s) => {
              const pct = totalRevenue > 0 ? (Number(s.revenue_cents) / totalRevenue) * 100 : 0;
              return (
                <li key={s.channel_id} className="px-6 py-4">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm font-medium">{s.channel_name}</span>
                    <span className="text-sm tabular-nums">
                      {formatMoney(Number(s.revenue_cents), store.currency, store.locale)}
                    </span>
                  </div>
                  {/* Una sola serie: proporción de cada canal sobre el total. */}
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-1.5 flex-1 bg-cream-deep">
                      <div
                        className="h-full rounded-r-[2px]"
                        style={{ width: `${pct}%`, backgroundColor: '#A87A1E' }}
                      />
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-ink-mute">
                      {s.orders} pedidos · {s.units} u. · {pct.toFixed(0)}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── Canales configurados ───────────────────────────────────────── */}
      <section className="border border-line/60 bg-white">
        <h2 className="border-b border-line/50 px-6 py-4 font-display text-lg">
          Tus canales
        </h2>

        <ul className="divide-y divide-line/40">
          {channels.map((c) => {
            const s = salesByChannel.get(c.id);
            return (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                <div className="flex items-center gap-3">
                  <Store className="h-4 w-4 shrink-0 text-ink-mute" strokeWidth={1.4} aria-hidden />
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-ink-mute">
                      {CHANNEL_LABEL[c.type] ?? c.type}
                      {c.stock_buffer > 0 && ` · reserva ${c.stock_buffer} u.`}
                      {s && Number(s.units) > 0 && ` · ${s.units} unidades vendidas`}
                    </p>
                  </div>
                </div>

                <a
                  href={`/api/export/inventario?canal=${c.id}`}
                  className="flex items-center gap-2 border border-line px-4 py-2 text-xs hover:border-ink"
                >
                  <Download className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                  Descargar inventario
                </a>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-line/50 p-6">
          <ChannelForm existing={channels.map((c) => c.type)} />
        </div>
      </section>

      <CsvImporter
        channels={channels.map((c) => ({
          id: c.id, name: c.name, type: c.type, csv_mapping: c.csv_mapping ?? {},
        }))}
      />

      {/* ── Historial ──────────────────────────────────────────────────── */}
      <section className="border border-line/60 bg-white">
        <div className="flex items-center gap-2 border-b border-line/50 px-6 py-4">
          <History className="h-4 w-4 text-ink-mute" strokeWidth={1.5} aria-hidden />
          <h2 className="font-display text-lg">Importaciones recientes</h2>
        </div>

        {batches.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-ink-mute">
            Todavía no has importado ningún archivo.
          </p>
        ) : (
          <ul className="divide-y divide-line/40">
            {batches.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm">
                    {b.filename ?? 'archivo sin nombre'}
                    {b.status === 'reverted' && (
                      <span className="ml-2 text-xs text-ink-mute">(revertida)</span>
                    )}
                  </p>
                  <p className="text-xs text-ink-mute">
                    {b.kind === 'sales' ? 'Ventas' : 'Existencias'}
                    {b.channel && ` · ${b.channel.name}`}
                    {' · '}
                    {new Date(b.created_at).toLocaleString(store.locale, {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                  <p className="mt-0.5 text-xs tabular-nums text-ink-mute">
                    {b.rows_imported} importadas
                    {b.rows_skipped > 0 && ` · ${b.rows_skipped} omitidas`}
                    {b.rows_failed > 0 && ` · ${b.rows_failed} con problemas`}
                  </p>
                </div>

                {b.kind === 'sales' && b.status === 'completed' && b.rows_imported > 0 && (
                  <RevertBatchButton batchId={b.id} />
                )}
              </li>
            ))}
          </ul>
        )}

        <p className="flex items-start gap-2.5 border-t border-line/50 bg-cream-deep/30 px-6 py-4 text-xs leading-relaxed text-ink-mute">
          <Undo2 className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
          <span>
            Si importas el archivo equivocado, <strong className="text-ink">revertir</strong>{' '}
            cancela esos pedidos y devuelve el inventario. Reimportar el mismo
            reporte no duplica nada: los pedidos ya vistos se omiten solos.
          </span>
        </p>
      </section>
    </div>
  );
}
