'use client';

import { useState, useTransition } from 'react';
import { Archive } from 'lucide-react';

import { deleteProduct } from '@/app/admin/(panel)/productos/actions';

/**
 * Archivar, no borrar. Un producto eliminado dejaría pedidos históricos sin
 * referencia; archivado desaparece de la tienda y conserva el historial.
 */
export function ArchiveButton({ productId }: { productId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="flex items-center gap-2 border border-line px-4 py-2 text-xs text-ink-mute hover:border-ink hover:text-ink"
      >
        <Archive className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> Archivar
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 border border-line/60 bg-white px-3 py-2">
      <span className="text-xs text-ink-mute">¿Quitarlo de la tienda?</span>
      <button
        onClick={() => startTransition(() => void deleteProduct(productId))}
        disabled={pending}
        className="bg-ink px-3 py-1.5 text-xs text-cream disabled:opacity-50"
      >
        {pending ? 'Archivando…' : 'Sí, archivar'}
      </button>
      <button onClick={() => setConfirming(false)} className="px-2 py-1.5 text-xs text-ink-mute">
        Cancelar
      </button>
    </div>
  );
}
