'use client';

import { useState, useTransition } from 'react';
import { Check, Loader2, Minus, Plus } from 'lucide-react';

import { setStock } from '@/app/admin/(panel)/productos/actions';

/**
 * Ajuste de stock por delta, no por valor absoluto.
 *
 * Es a propósito: "llegaron 12" es lo que de verdad pasa en la bodega, y deja
 * una bitácora que cuadra. Escribir "ahora hay 40" pisaría cualquier venta
 * ocurrida entre que el cliente abrió la pantalla y presionó guardar.
 */
export function StockAdjuster({
  variantId,
  current,
}: {
  variantId: string;
  current: number;
}) {
  const [delta, setDelta] = useState(0);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const resulting = Math.max(current + delta, 0);

  function apply() {
    if (delta === 0) return;
    startTransition(async () => {
      await setStock(variantId, delta);
      setDelta(0);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <div className="flex items-center border border-line">
        <button
          type="button"
          onClick={() => setDelta((d) => d - 1)}
          className="px-2 py-1.5 text-ink-mute hover:text-ink"
          aria-label="Restar una unidad"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>

        <input
          type="number"
          value={delta}
          onChange={(e) => setDelta(Number(e.target.value) || 0)}
          aria-label="Cantidad a ajustar"
          className="w-14 border-x border-line bg-transparent py-1.5 text-center text-sm tabular-nums focus:outline-none"
        />

        <button
          type="button"
          onClick={() => setDelta((d) => d + 1)}
          className="px-2 py-1.5 text-ink-mute hover:text-ink"
          aria-label="Sumar una unidad"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {delta !== 0 && (
        <span className="text-xs tabular-nums text-ink-mute" aria-live="polite">
          → {resulting}
        </span>
      )}

      <button
        type="button"
        onClick={apply}
        disabled={delta === 0 || pending}
        className="min-w-[4.5rem] bg-ink px-3 py-1.5 text-xs text-cream disabled:opacity-30"
      >
        {pending ? (
          <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" />
        ) : done ? (
          <Check className="mx-auto h-3.5 w-3.5" />
        ) : (
          'Aplicar'
        )}
      </button>
    </div>
  );
}
