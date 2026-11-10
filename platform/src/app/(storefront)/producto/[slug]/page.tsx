import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Truck, RotateCcw, ShieldCheck } from 'lucide-react';

import { BuyBox } from '@/components/storefront/buy-box';
import { ProductCard } from '@/components/storefront/product-card';
import { SectionHeading } from '@/components/storefront/sections';
import { getProductBySlug, getRelatedProducts } from '@/lib/queries';
import { requireStore } from '@/lib/tenant';

export const revalidate = 180;

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const store = await requireStore();
  const product = await getProductBySlug(store.id, slug);

  if (!product) return { title: 'Producto no encontrado' };

  const description =
    product.seo_description ?? product.short_description ?? product.description?.slice(0, 160);

  return {
    title: product.seo_title ?? product.name,
    description: description ?? undefined,
    openGraph: {
      title: product.name,
      description: description ?? undefined,
      type: 'website',
      images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const store = await requireStore();
  const product = await getProductBySlug(store.id, slug);

  if (!product) notFound();

  const related = await getRelatedProducts(store.id, product.category_id, product.id);
  const attributes = Object.entries(product.attributes ?? {}).filter(
    ([, v]) => v !== null && v !== '',
  );

  const inStock = !product.track_inventory ||
    product.variants.some((v) => v.is_active && v.stock > 0);

  // Datos estructurados: es lo que hace que Google muestre precio y
  // disponibilidad en el resultado de búsqueda.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.short_description ?? product.description ?? undefined,
    image: product.images.map((i) => i.url),
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    sku: product.variants[0]?.sku ?? undefined,
    offers: {
      '@type': 'Offer',
      price: (product.price_cents / 100).toFixed(2),
      priceCurrency: store.currency,
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <nav aria-label="Ruta" className="mb-8 text-xs text-ink-mute">
          <Link href="/" className="hover:text-ink">Inicio</Link>
          <span className="mx-2" aria-hidden>/</span>
          <Link href="/tienda" className="hover:text-ink">Tienda</Link>
          {product.category && (
            <>
              <span className="mx-2" aria-hidden>/</span>
              <Link href={`/tienda?categoria=${product.category.slug}`} className="hover:text-ink">
                {product.category.name}
              </Link>
            </>
          )}
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="relative aspect-square overflow-hidden bg-cream-deep">
              {product.images[0] ? (
                <Image
                  src={product.images[0].url}
                  alt={product.images[0].alt ?? product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center text-line">Sin imagen</div>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-3">
                {product.images.slice(1, 6).map((img) => (
                  <div key={img.id} className="relative aspect-square overflow-hidden bg-cream-deep">
                    <Image
                      src={img.url}
                      alt={img.alt ?? product.name}
                      fill
                      sizes="20vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:py-4">
            {product.brand && <p className="eyebrow">{product.brand}</p>}

            <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
              {product.name}
            </h1>

            {product.short_description && (
              <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-mute">
                {product.short_description}
              </p>
            )}

            <div className="mt-8">
              <BuyBox product={product} store={store} />
            </div>

            <ul className="mt-9 space-y-3 border-t border-line/50 pt-7 text-sm text-ink-mute">
              <li className="flex items-center gap-3">
                <Truck className="h-4 w-4 shrink-0 text-gold-deep" strokeWidth={1.4} aria-hidden />
                Envío a todo Estados Unidos con número de rastreo
              </li>
              <li className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 shrink-0 text-gold-deep" strokeWidth={1.4} aria-hidden />
                Pago seguro procesado por Stripe
              </li>
              <li className="flex items-center gap-3">
                <RotateCcw className="h-4 w-4 shrink-0 text-gold-deep" strokeWidth={1.4} aria-hidden />
                Devoluciones dentro de los primeros 30 días
              </li>
            </ul>

            {product.description && (
              <section className="mt-9 border-t border-line/50 pt-7">
                <h2 className="font-display text-xl">Descripción</h2>
                <div className="mt-3 whitespace-pre-line text-[0.95rem] leading-relaxed text-ink-mute">
                  {product.description}
                </div>
              </section>
            )}

            {attributes.length > 0 && (
              <section className="mt-8 border-t border-line/50 pt-7">
                <h2 className="font-display text-xl">Detalles</h2>
                <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {attributes.map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-4 border-b border-line/30 pb-2">
                      <dt className="text-xs uppercase tracking-wide text-ink-mute">{key}</dt>
                      <dd className="text-right text-sm">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-20">
            <SectionHeading accent="gustar" href="/tienda">
              También te puede
            </SectionHeading>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} store={store} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
