import type { Metadata } from 'next';
import Link from 'next/link';

import { ProductCard } from '@/components/storefront/product-card';
import { getCategories, getProducts } from '@/lib/queries';
import { requireStore } from '@/lib/tenant';

export const revalidate = 180;

export const metadata: Metadata = {
  title: 'Tienda',
  description: 'Explora nuestra colección completa.',
};

const SORTS = [
  { value: 'recientes', label: 'Más recientes' },
  { value: 'precio-asc', label: 'Precio: menor a mayor' },
  { value: 'precio-desc', label: 'Precio: mayor a menor' },
  { value: 'nombre', label: 'Nombre A–Z' },
] as const;

const PER_PAGE = 24;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const store = await requireStore();
  const params = await searchParams;

  const categorySlug = first(params.categoria);
  const search = first(params.q);
  const sortParam = first(params.orden);
  const sort = SORTS.some((s) => s.value === sortParam)
    ? (sortParam as (typeof SORTS)[number]['value'])
    : 'recientes';
  const page = Math.max(1, Number(first(params.page) ?? 1) || 1);

  const [categories, { products, total }] = await Promise.all([
    getCategories(store.id),
    getProducts(store.id, {
      categorySlug,
      search,
      sort,
      limit: PER_PAGE,
      offset: (page - 1) * PER_PAGE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const activeCategory = categories.find((c) => c.slug === categorySlug);

  /** Conserva los filtros vigentes al cambiar uno solo. */
  function buildHref(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    const merged = { categoria: categorySlug, q: search, orden: sort, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value && !(key === 'orden' && value === 'recientes')) next.set(key, value);
    }
    const qs = next.toString();
    return qs ? `/tienda?${qs}` : '/tienda';
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <header className="mb-10">
        <nav aria-label="Ruta" className="mb-4 text-xs text-ink-mute">
          <Link href="/" className="hover:text-ink">Inicio</Link>
          <span className="mx-2" aria-hidden>/</span>
          <span className="text-ink">{activeCategory?.name ?? 'Tienda'}</span>
        </nav>

        <h1 className="font-display text-4xl sm:text-5xl">
          {activeCategory?.name ?? (search ? `Resultados para “${search}”` : 'Toda la colección')}
        </h1>
        {activeCategory?.description && (
          <p className="mt-3 max-w-xl text-sm text-ink-mute">{activeCategory.description}</p>
        )}
      </header>

      <form action="/tienda" method="get" className="mb-6 flex gap-2" role="search">
        {categorySlug && <input type="hidden" name="categoria" value={categorySlug} />}
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Buscar por nombre o marca…"
          aria-label="Buscar productos"
          className="field max-w-sm"
        />
        <button type="submit" className="btn-ink px-6 py-3 text-sm">Buscar</button>
      </form>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-line/50 pb-5">
        <div className="flex flex-wrap gap-2">
          <Link
            href={buildHref({ categoria: undefined, page: undefined })}
            className={`border px-4 py-2 text-xs uppercase tracking-wide transition-colors ${
              !categorySlug
                ? 'border-ink bg-ink text-cream'
                : 'border-line text-ink-mute hover:border-ink hover:text-ink'
            }`}
          >
            Todo
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={buildHref({ categoria: cat.slug, page: undefined })}
              className={`border px-4 py-2 text-xs uppercase tracking-wide transition-colors ${
                categorySlug === cat.slug
                  ? 'border-ink bg-ink text-cream'
                  : 'border-line text-ink-mute hover:border-ink hover:text-ink'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs text-ink-mute">
          <span className="tabular-nums">{total} producto{total === 1 ? '' : 's'}</span>
          <span className="h-4 w-px bg-line" aria-hidden />
          {/* Ordenamiento con <a>: funciona sin JavaScript y es indexable. */}
          <div className="flex gap-2">
            {SORTS.map((s) => (
              <Link
                key={s.value}
                href={buildHref({ orden: s.value, page: undefined })}
                className={sort === s.value ? 'text-ink underline underline-offset-4' : 'hover:text-ink'}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-display text-xl">No encontramos productos</p>
          <p className="mt-2 text-sm text-ink-mute">
            Prueba con otra búsqueda o explora todas las categorías.
          </p>
          <Link href="/tienda" className="btn-outline mt-7">Ver todo</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} store={store} priority={i < 4} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Paginación">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={buildHref({ page: n === 1 ? undefined : String(n) })}
              aria-current={n === page ? 'page' : undefined}
              className={`grid h-10 w-10 place-items-center border text-sm tabular-nums ${
                n === page
                  ? 'border-ink bg-ink text-cream'
                  : 'border-line text-ink-mute hover:border-ink hover:text-ink'
              }`}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
