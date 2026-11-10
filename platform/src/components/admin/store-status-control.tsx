'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';

import { setStoreStatus } from '@/app/admin/(panel)/plataforma/actions';

type Status = 'draft' | 'active' | 'suspended';

export function StoreStatusControl({
  storeId,
  status,
}: {
  storeId: string;
  status: Status;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<Status | null>(null);

  function apply(next: Status) {
    startTransition(async () => {
      await setStoreStatus(storeId, next);
      setConfirming(null);
    });
  }

  if (pending) {
    return <Loader2 className="h-4 w-4 animate-spin text-ink-mute" aria-label="Guardando" />;
  }

  // Suspender tumba la tienda de un cliente: siempre pide confirmación.
  if (confirming === 'suspended') {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-ink-mute">¿Dejarla fuera de servicio?</span>
        <button onClick={() => apply('suspended')} className="bg-red-700 px-3 py-1.5 text-white">
          Suspender
        </button>
        <button onClick={() => setConfirming(null)} className="px-2 py-1.5 text-ink-mute">
          No
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-1.5">
      {status !== 'active' && (
        <button
          onClick={() => apply('active')}
          className="border border-line px-3 py-1.5 text-xs hover:border-ink"
        >
          {status === 'suspended' ? 'Reactivar' : 'Publicar'}
        </button>
      )}
      {status === 'active' && (
        <button
          onClick={() => setConfirming('suspended')}
          className="border border-line px-3 py-1.5 text-xs text-ink-mute hover:border-red-700 hover:text-red-700"
        >
          Suspender
        </button>
      )}
    </div>
  );
}
