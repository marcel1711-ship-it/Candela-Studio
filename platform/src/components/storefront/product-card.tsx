'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag } from 'lucide-react';
import { useState } from 'react';

import { useCart } from './cart-provider';
import { discountPercent, formatMoney } from '@/lib/money';
import type { ProductWithRelations, Store } from '@/lib/types';

export function ProductCard({
  product,
  store,
  priority = false,
}: {
  product: ProductWithRelations;
  store: Store;
  priority?: boolean;
}) {
  const [wished, setWished] = useState(false);

  const { add } = useCart();

  const image = product.images[0];
  const variants = product.variants.filter((v) => v.is_active);
  const defaultVariant = variants.find((v) => v.is_default) ?? variants[0];
  const hasOptions = variants.length > 1;

  const priceCents = defaultVariant?.price_cents ?? product.price_cents;
  const compareAt = defaultVariant?.compare_at_cents ?? product.compare_at_cents;
  const off = discountPercent(priceCents, compareAt);

  const totalStock = variants.reduce((n, v) => n + v.stock, 0);
  const soldOut = product.track_inventory && totalStock <= 0;
  // Urgencia honesta: solo se muestra si de verdad queda poco.
  const lastUnits = product.track_inventory && totalStock > 0 && totalStock <= 3;

  function quickAdd() {
    if (!defaultVariant || soldOut) return;
    add({
      variantId: defaultVariant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      variantName: defaultVariant.name,
      priceCents,
      imageUrl: image?.url ?? null,
      maxStock: product.track_inventory ? defaultVariant.stock : 99,
    });
  }

  return (
    <article className="group card relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden bg-cream-deep">
        <Link href={`/producto/${product.slug}`} className="block h-full w-full">
          {image ? (
            <Image
              src={image.url}
              alt={image.alt ?? product.name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-line">
              <ShoppingBag className="h-8 w-8" strokeWidth={1} />
            </div>
          )}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
          {off && (
            <span className="bg-ink px-2 py-1 text-[0.65rem] font-semibold tracking-wide text-cream">
              -{off}%
            </span>
          )}
          {soldOut && (
            <span className="bg-ink-mute px-2 py-1 text-[0.65rem] tracking-wide text-cream">
              Agotado
            </span>
          )}
          {lastUnits && !soldOut && (
            <span className="bg-gold px-2 py-1 text-[0.65rem] font-semibold tracking-wide text-ink">
              Últimas {totalStock}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setWished((w) => !w)}
          aria-label={wished ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          aria-pressed={wished}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-cream/85 text-ink backdrop-blur-sm transition-colors hover:bg-cream"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${wished ? 'fill-gold-deep text-gold-deep' : ''}`}
            strokeWidth={1.4}
          />
        </button>

        {/* Compra rápida: aparece al hover en escritorio, siempre visible en
            táctil, donde el hover no existe. */}
        {!soldOut && (
          <div className="absolute inset-x-0 bottom-0 translate-y-full p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 max-lg:translate-y-0 max-lg:opacity-100">
            {hasOptions ? (
              <Link
                href={`/producto/${product.slug}`}
                className="btn w-full bg-ink/92 py-2.5 text-xs uppercase tracking-wideish text-cream backdrop-blur-sm hover:bg-ink"
              >
                Elegir opción
              </Link>
            ) : (
              <button
                onClick={quickAdd}
                className="btn w-full bg-ink/92 py-2.5 text-xs uppercase tracking-wideish text-cream backdrop-blur-sm hover:bg-ink"
              >
                Agregar al carrito
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-4 py-4">
        {product.brand && (
          <span className="mb-1 text-[0.65rem] uppercase tracking-wideish text-ink-mute">
            {product.brand}
          </span>
        )}

        <h3 className="font-display text-[0.95rem] leading-snug">
          <Link href={`/producto/${product.slug}`} className="hover:text-gold-deep">
            {product.name}
          </Link>
        </h3>

        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className="text-sm font-medium tabular-nums">
            {formatMoney(priceCents, store.currency, store.locale)}
          </span>
          {off && (
            <span className="text-xs text-ink-mute line-through tabular-nums">
              {formatMoney(compareAt!, store.currency, store.locale)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
