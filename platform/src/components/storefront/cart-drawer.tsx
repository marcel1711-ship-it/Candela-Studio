'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';

import { useCart } from './cart-provider';
import { formatMoney } from '@/lib/money';
import type { Store } from '@/lib/types';

export function CartDrawer({ store }: { store: Store }) {
  const { lines, isOpen, close, setQuantity, remove, subtotalCents, count } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: lines.map((l) => ({ variant_id: l.variantId, quantity: l.quantity })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No pudimos iniciar el pago.');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado.');
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Carrito">
      <button className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" onClick={close} aria-label="Cerrar carrito" />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream shadow-lift">
        <div className="flex items-center justify-between border-b border-line/50 px-6 py-5">
          <h2 className="font-display text-xl">
            Tu carrito {count > 0 && <span className="text-ink-mute">({count})</span>}
          </h2>
          <button onClick={close} className="p-1 text-ink-mute hover:text-ink" aria-label="Cerrar">
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag className="h-10 w-10 text-line" strokeWidth={1} />
            <p className="text-ink-mute">Tu carrito está vacío.</p>
            <Link href="/tienda" onClick={close} className="btn-outline">
              Explorar la tienda
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line/40 overflow-y-auto px-6">
              {lines.map((line) => (
                <li key={line.variantId} className="flex gap-4 py-5">
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-cream-deep">
                    {line.imageUrl && (
                      <Image
                        src={line.imageUrl}
                        alt={line.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/producto/${line.slug}`}
                      onClick={close}
                      className="font-display text-base leading-snug hover:text-gold-deep"
                    >
                      {line.name}
                    </Link>
                    {line.variantName && line.variantName !== 'Única' && (
                      <span className="mt-0.5 text-xs text-ink-mute">{line.variantName}</span>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center border border-line">
                        <button
                          onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                          className="px-2.5 py-1.5 text-ink-mute hover:text-ink"
                          aria-label="Quitar uno"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[2rem] text-center text-sm tabular-nums">
                          {line.quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                          disabled={line.quantity >= line.maxStock}
                          className="px-2.5 py-1.5 text-ink-mute hover:text-ink disabled:opacity-30"
                          aria-label="Agregar uno"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <span className="text-sm font-medium tabular-nums">
                        {formatMoney(line.priceCents * line.quantity, store.currency, store.locale)}
                      </span>
                    </div>

                    {line.quantity >= line.maxStock && (
                      <span className="mt-1.5 text-[0.7rem] text-gold-deep">
                        Último disponible{line.maxStock > 1 ? 's' : ''}: {line.maxStock}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => remove(line.variantId)}
                    className="self-start p-1 text-ink-mute/60 hover:text-ink"
                    aria-label={`Eliminar ${line.name}`}
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.4} />
                  </button>
                </li>
              ))}
            </ul>

            <div className="border-t border-line/50 bg-cream-deep/50 px-6 py-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-ink-mute">Subtotal</span>
                <span className="font-display text-2xl tabular-nums">
                  {formatMoney(subtotalCents, store.currency, store.locale)}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-mute">
                Envío e impuestos se calculan en el pago.
              </p>

              {error && (
                <p role="alert" className="mt-3 border-l-2 border-red-500 bg-red-50 px-3 py-2 text-xs text-red-800">
                  {error}
                </p>
              )}

              <button
                onClick={checkout}
                disabled={submitting}
                className="btn-gold mt-4 w-full py-4 text-[0.8rem] uppercase tracking-wideish"
              >
                {submitting ? 'Redirigiendo…' : 'Proceder al pago'}
              </button>

              <p className="mt-3 text-center text-[0.7rem] text-ink-mute">
                Pago seguro procesado por Stripe
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
