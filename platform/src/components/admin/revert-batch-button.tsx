'use client';

import { useState, useTransition } from 'react';
import { Loader2, Undo2 } from 'lucide-react';

import { revertBatch } from '@/app/admin/(panel)/canales/actions';

export function RevertBatchButton({ batchId }: { batchId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (pending) {
    return <Loader2 className="h-4 w-4 animate-spin text-ink-mute" aria-label="Revirtiendo" />;
  }

  if (error) {
    return <span className="text-xs text-red-700">{error}</span>;
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="flex items-center gap-1.5 border border-line px-3 py-1.5 text-xs text-ink-mute hover:border-ink hover:text-ink"
      >
        <Undo2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> Revertir
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-ink-mute">¿Cancelar pedidos y devolver stock?</span>
      <button
        onClick={() =>
          startTransition(async () => {
            const res = await revertBatch(batchId);
            if (res.error) setError(res.error);
            setConfirming(false);
          })
        }
        className="bg-ink px-3 py-1.5 text-cream"
      >
        Sí, revertir
      </button>
      <button onClick={() => setConfirming(false)} className="px-2 py-1.5 text-ink-mute">
        No
      </button>
    </div>
  );
}
