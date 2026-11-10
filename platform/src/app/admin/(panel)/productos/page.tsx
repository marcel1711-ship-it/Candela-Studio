import Image from 'next/image';
import Link from 'next/link';
import { Package, Plus } from 'lucide-react';

import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatMoney } from '@/lib/money';

type SearchParams = Promise<{ q?: string; estado?: string }>;

const STATUS_LABEL: Record<string, string> = {
  active: 'Publicado',
  draft: 'Borrador',
  archived: 'Archivado',
};

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  draft: 'bg-cream-deep text-ink-mute border-line',
  archived: 'bg-red-50 text-red-800 border-red-200',
};

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const { store } = await requireAdmin();
  const { q, estado } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('products')
    .select(`
      id, name, slug, brand, status, price_cents, is_featured, track_inventory,
      images:product_images(url, position),
      variants:product_variants(id, stock, is_active)
    `)
    .eq('store_id', store.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (estado && estado !== 'todos') query = query.eq('status', estado);
  if (q?.trim()) query = query.ilike('name', `%${q.trim()}%`);

  const { data } = await query;

  type Row = {
    id: string; name: string; slug: string; brand: string | null; status: string;
    price_cents: number; is_featured: boolean; track_inventory: boolean;
    images: { url: string; position: number }[];
    variants: { id: string; stock: number; is_active: boolean }[];
  };
  const products = (data ?? []) as unknown as Row[];

  const filters = [
    { value: 'todos', label: 'Todos' },
    { value: 'active', label: 'Publicados' },
    { value: 'draft', label: 'Borradores' },
    { value: 'archived', label: 'Archivados' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Productos</h1>
          <p className="mt-1 text-sm text-ink-mute">
            {products.length} producto{products.length === 1 ? '' : 's'}
          </p>
        </div>
        <Link href="/admin/productos/nuevo" className="btn-ink px-5 py-2.5 text-sm">
          <Plus className="h-4 w-4" aria-hidden /> Nuevo producto
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <form action="/admin/productos" method="get" role="search" className="flex gap-2">
          {estado && <input type="hidden" name="estado" value={estado} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar producto…"
            aria-label="Buscar producto"
            className="field w-56 py-2"
          />
          <button type="submit" className="btn-outline px-4 py-2 text-sm">Buscar</button>
        </form>

        <div className="flex gap-1.5">
          {filters.map((f) => {
            const active = (estado ?? 'todos') === f.value;
            return (
              <Link
                key={f.value}
                href={`/admin/productos?estado=${f.value}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                className={`border px-3 py-2 text-xs transition-colors ${
                  active ? 'border-ink bg-ink text-cream' : 'border-line text-ink-mute hover:border-ink'
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="border border-line/60 bg-white px-6 py-20 text-center">
          <Package className="mx-auto h-10 w-10 text-line" strokeWidth={1} aria-hidden />
          <h2 className="mt-4 font-display text-xl">
            {q ? 'Sin resultados' : 'Todavía no hay productos'}
          </h2>
          <p className="mt-2 text-sm text-ink-mute">
            {q ? 'Prueba con otro término.' : 'Crea el primero para que aparezca en tu tienda.'}
          </p>
          {!q && (
            <Link href="/admin/productos/nuevo" className="btn-ink mt-6 px-5 py-2.5 text-sm">
              <Plus className="h-4 w-4" aria-hidden /> Nuevo producto
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto border border-line/60 bg-white">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="border-b border-line/60 bg-cream-deep/40 text-left">
              <tr className="text-[0.7rem] uppercase tracking-wide text-ink-mute">
                <th scope="col" className="px-5 py-3 font-medium">Producto</th>
                <th scope="col" className="px-5 py-3 font-medium">Estado</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Precio</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Stock</th>
                <th scope="col" className="px-5 py-3"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {products.map((p) => {
                const image = [...(p.images ?? [])].sort((a, b) => a.position - b.position)[0];
                const stock = (p.variants ?? [])
                  .filter((v) => v.is_active)
                  .reduce((n, v) => n + v.stock, 0);

                return (
                  <tr key={p.id} className="hover:bg-cream-deep/20">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden bg-cream-deep">
                          {image && (
                            <Image src={image.url} alt="" fill sizes="44px" className="object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/productos/${p.id}`}
                            className="block truncate font-medium hover:text-gold-deep"
                          >
                            {p.name}
                          </Link>
                          <p className="truncate text-xs text-ink-mute">
                            {p.brand ?? '—'}
                            {p.is_featured && <span className="ml-2 text-gold-deep">★ Destacado</span>}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3">
                      <span className={`border px-2 py-1 text-[0.7rem] ${STATUS_STYLE[p.status]}`}>
                        {STATUS_LABEL[p.status]}
                      </span>
                    </td>

                    <td className="px-5 py-3 text-right tabular-nums">
                      {formatMoney(p.price_cents, store.currency, store.locale)}
                    </td>

                    <td className="px-5 py-3 text-right tabular-nums">
                      {p.track_inventory ? (
                        <span className={stock <= 0 ? 'text-red-700' : stock <= 5 ? 'text-[#A87A1E]' : ''}>
                          {stock}
                        </span>
                      ) : (
                        <span className="text-ink-mute">∞</span>
                      )}
                    </td>

                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/productos/${p.id}`}
                        className="text-xs text-ink-mute hover:text-ink"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
