'use client';

import { useActionState, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';

import { saveChannel, type ImportState } from '@/app/admin/(panel)/canales/actions';

const TYPES = [
  { value: 'amazon', label: 'Amazon' },
  { value: 'walmart', label: 'Walmart' },
  { value: 'tiktok', label: 'TikTok Shop' },
  { value: 'etsy', label: 'Etsy' },
  { value: 'ebay', label: 'eBay' },
  { value: 'mercadolibre', label: 'Mercado Libre' },
  { value: 'otro', label: 'Otro' },
];

export function ChannelForm({ existing }: { existing: string[] }) {
  const [state, formAction, pending] = useActionState<ImportState, FormData>(saveChannel, {});
  const [open, setOpen] = useState(false);

  const available = TYPES.filter((t) => t.value === 'otro' || !existing.includes(t.value));

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-4">
        <button onClick={() => setOpen(true)} className="btn-outline px-5 py-2.5 text-sm">
          <Plus className="h-4 w-4" aria-hidden /> Agregar canal
        </button>
        {state.ok && <p role="status" className="text-sm text-emerald-800">{state.ok}</p>}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p role="alert" className="border-l-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="type" className="label">Marketplace</label>
          <select id="type" name="type" required className="field">
            {available.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="ch-name" className="label">Nombre</label>
          <input
            id="ch-name" name="name" required maxLength={60}
            className="field" placeholder="Amazon USA"
          />
        </div>

        <div>
          <label htmlFor="stock_buffer" className="label">Reserva de stock</label>
          <input
            id="stock_buffer" name="stock_buffer" type="number" min={0} defaultValue={0}
            className="field tabular-nums"
          />
          <p className="mt-1 text-[0.7rem] text-ink-mute">
            Unidades que no se publican aquí, contra la sobreventa.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn-ink px-6 py-2.5 text-sm">
          {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</> : 'Agregar canal'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost text-sm">
          Cancelar
        </button>
      </div>
    </form>
  );
}
