import Link from 'next/link';

import { ProductCard } from '@/components/storefront/product-card';
import {
  CategoryCards, Hero, SectionHeading, TrustBar,
} from '@/components/storefront/sections';
import { getCategories, getFeaturedProducts, getProducts } from '@/lib/queries';
import { requireStore } from '@/lib/tenant';

// ISR: la portada se sirve estática y se revalida sola. Un cambio de precio
// en el panel se refleja sin rebuild, y Google indexa HTML completo.
export const revalidate = 300;

export default async function HomePage() {
  const store = await requireStore();

  const [featured, categories, latest] = await Promise.all([
    getFeaturedProducts(store.id, 5),
    getCategories(store.id),
    getProducts(store.id, { limit: 10 }),
  ]);

  // Si el cliente aún no marca destacados, mostramos lo más reciente:
  // una portada vacía es peor que una portada automática.
  const bestsellers = featured.length > 0 ? featured : latest.products.slice(0, 5);

  return (
    <>
      <Hero store={store} />
      <TrustBar />
      <CategoryCards categories={categories} />

      {bestsellers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <SectionHeading accent="Bestseller" href="/tienda" linkLabel="Ver toda la tienda">
            Nuestros
          </SectionHeading>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {bestsellers.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                store={store}
                priority={i < 3}
              />
            ))}
          </div>
        </section>
      )}

      {latest.products.length > 5 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <SectionHeading accent="Llegadas" href="/tienda">
            Nuevas
          </SectionHeading>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {latest.products.slice(5, 10).map((product) => (
              <ProductCard key={product.id} product={product} store={store} />
            ))}
          </div>
        </section>
      )}

      {bestsellers.length === 0 && (
        <section className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h2 className="font-display text-2xl">La tienda está casi lista</h2>
          <p className="mt-3 text-sm text-ink-mute">
            Todavía no hay productos publicados. Agrégalos desde el panel para
            que aparezcan aquí.
          </p>
          <Link href="/admin/productos" className="btn-outline mt-7">
            Ir al panel
          </Link>
        </section>
      )}

      {/* Franja de cierre: refuerza marca y empuja a la tienda. */}
      <section className="bg-ink py-16 text-center text-cream">
        <div className="mx-auto max-w-2xl px-4">
          <p className="eyebrow text-gold-light/90">{store.tagline ?? 'Esencias con carácter'}</p>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl">
            Encuentra la tuya <span className="accent-script">hoy</span>
          </h2>
          <Link href="/tienda" className="btn-gold mt-8 text-[0.8rem] uppercase tracking-wideish">
            Ver colección completa <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    </>
  );
}
