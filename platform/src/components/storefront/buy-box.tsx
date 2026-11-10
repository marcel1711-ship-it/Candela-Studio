'use client';

import { useState } from 'react';
import { Check, Minus, Plus, ShoppingBag } from 'lucide-react';

import { useCart } from './cart-provider';
import { discountPercent, formatMoney } from '@/lib/money';
import type { ProductWithRelations, Store } from '@/lib/types';

export function BuyBox({
  product,
  store,
}: {
  product: ProductWithRelations;
  store: Store;
}) {
  const { add } = useCart();
  const variants = product.variants.filter((v) => v.is_active);

  const [variantId, setVariantId] = useState(
    (variants.find((v) => v.is_default) ?? variants[0])?.id ?? '',
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = variants.find((v) => v.id === variantId) ?? variants[0];

  const priceCents = variant?.price_cents ?? product.price_cents;
  const compareAt = variant?.compare_at_cents ?? product.compare_at_cents;
  const off = discountPercent(priceCents, compareAt);

  const tracked = product.track_inventory;
  const stock = variant?.stock ?? 0;
  const soldOut = tracked && stock <= 0;
  const maxQty = tracked ? Math.max(stock, 0) : 99;

  function handleAdd() {
    if (!variant || soldOut) return;
    add(
      {
        variantId: variant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        variantName: variant.name,
        priceCents,
        imageUrl: product.images[0]?.url ?? null,
        maxStock: maxQty,
      },
      quantity,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="font-display text-3xl tabular-nums">
          {formatMoney(priceCents, store.currency, store.locale)}
        </span>
        {off && (
          <>
            <span className="text-base text-ink-mute line-through tabular-nums">
              {formatMoney(compareAt!, store.currency, store.locale)}
            </span>
            <span className="bg-ink px-2 py-0.5 text-xs font-semibold text-cream">-{off}%</span>
          </>
        )}
      </div>

      {variants.length > 1 && (
        <fieldset className="mt-7">
          <legend className="label">
            {variant?.option_name ?? 'Presentación'}
          </legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const vSoldOut = tracked && v.stock <= 0;
              const selected = v.id === variantId;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={vSoldOut}
                  onClick={() => {
                    setVariantId(v.id);
                    setQuantity(1);
                  }}
                  aria-pressed={selected}
                  className={`border px-4 py-2.5 text-sm transition-colors ${
                    selected
                      ? 'border-ink bg-ink text-cream'
                      : 'border-line text-ink hover:border-ink'
                  } ${vSoldOut ? 'cursor-not-allowed line-through opacity-40' : ''}`}
                >
                  {v.option_value ?? v.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Señal de inventario honesta: solo cuando de verdad queda poco. */}
      {tracked && !soldOut && stock <= 5 && (
        <p className="mt-5 flex items-center gap-2 text-sm text-gold-deep">
          <span className="h-1.5 w-1.5 rounded-full bg-gold-deep" aria-hidden />
          Quedan {stock} unidad{stock === 1 ? '' : 'es'} disponible{stock === 1 ? '' : 's'}
        </p>
      )}

      <div className="mt-7 flex gap-3">
        <div className="flex items-center border border-line">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="px-3.5 py-3.5 text-ink-mute hover:text-ink disabled:opacity-30"
            aria-label="Disminuir cantidad"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-[2.5rem] text-center text-sm tabular-nums" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            disabled={quantity >= maxQty}
            className="px-3.5 py-3.5 text-ink-mute hover:text-ink disabled:opacity-30"
            aria-label="Aumentar cantidad"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={soldOut}
          className="btn-gold flex-1 py-4 text-[0.8rem] uppercase tracking-wideish"
        >
          {soldOut ? (
            'Agotado'
          ) : added ? (
            <><Check className="h-4 w-4" /> Agregado</>
          ) : (
            <><ShoppingBag className="h-4 w-4" /> Agregar al carrito</>
          )}
        </button>
      </div>

      {soldOut && (
        <p className="mt-4 border-l-2 border-line bg-cream-deep/60 px-4 py-3 text-sm text-ink-mute">
          Este producto está agotado. Escríbenos y te avisamos en cuanto vuelva.
        </p>
      )}
    </div>
  );
}
