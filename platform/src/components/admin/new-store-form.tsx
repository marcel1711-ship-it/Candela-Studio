'use client';

import { useActionState, useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';

import { createStore, type StoreState } from '@/app/admin/(panel)/plataforma/actions';

/** Sugiere el identificador a partir del nombre, sin pisar lo que ya escribieron. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export function NewStoreForm() {
  const [state, formAction, pending] = useActionState<StoreState, FormData>(createStore, {});
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'wearecandela.com';

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-4">
        <button onClick={() => setOpen(true)} className="btn-ink px-5 py-2.5 text-sm">
          <Plus className="h-4 w-4" aria-hidden /> Nueva tienda
        </button>

        {state.ok && (
          <p role="status" className="border-l-2 border-emerald-600 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900">
            {state.ok}
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5 border border-line/60 bg-white p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-lg">Nueva tienda</h2>
          <p className="mt-1 text-xs text-ink-mute">
            Nace en borrador: solo tú la ves hasta que la publiques.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="p-1 text-ink-mute hover:text-ink"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {state.error && (
        <p role="alert" className="border-l-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="border-l-2 border-emerald-600 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {state.ok}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label">Nombre del negocio *</label>
          <input
            id="name" name="name" required maxLength={80}
            onChange={(e) => { if (!slugTouched) setSlug(slugify(e.target.value)); }}
            className="field" placeholder="Perfumería La Rosa"
          />
        </div>

        <div>
          <label htmlFor="slug" className="label">Identificador *</label>
          <input
            id="slug" name="slug" required maxLength={40} value={slug}
            onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }}
            className="field font-mono text-sm" placeholder="la-rosa"
          />
          <p className="mt-1.5 text-xs text-ink-mute">
            Su dirección será{' '}
            <span className="font-mono">{slug || 'identificador'}.{rootDomain}</span>
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="tagline" className="label">Lema</label>
        <input
          id="tagline" name="tagline" maxLength={120}
          className="field" placeholder="Perfumes árabes e italianos"
        />
      </div>

      <div className="grid gap-4 border-t border-line/40 pt-5 sm:grid-cols-2">
        <div>
          <label htmlFor="owner_email" className="label">Correo del dueño *</label>
          <input
            id="owner_email" name="owner_email" type="email" required
            className="field" placeholder="dueno@sunegocio.com"
          />
          <p className="mt-1.5 text-xs text-ink-mute">
            Le llega una invitación para poner su contraseña.
          </p>
        </div>

        <div>
          <label htmlFor="owner_name" className="label">Nombre del dueño</label>
          <input id="owner_name" name="owner_name" maxLength={120} className="field" />
        </div>
      </div>

      <div className="grid gap-4 border-t border-line/40 pt-5 sm:grid-cols-3">
        <div>
          <label htmlFor="currency" className="label">Moneda</label>
          <select id="currency" name="currency" defaultValue="USD" className="field">
            <option value="USD">USD</option>
            <option value="MXN">MXN</option>
          </select>
        </div>

        <div>
          <label htmlFor="low_stock_threshold" className="label">Umbral de stock</label>
          <input
            id="low_stock_threshold" name="low_stock_threshold"
            type="number" min={0} defaultValue={5}
            className="field tabular-nums"
          />
        </div>

        <div>
          <label htmlFor="platform_fee_pct" className="label">Tu comisión (%)</label>
          <input
            id="platform_fee_pct" name="platform_fee_pct"
            type="number" min={0} max={20} step={0.25} defaultValue={0}
            className="field tabular-nums"
          />
          <p className="mt-1.5 text-xs text-ink-mute">
            Se cobra sola en cada venta.
          </p>
        </div>
      </div>

      <div className="flex gap-3 border-t border-line/40 pt-5">
        <button type="submit" disabled={pending} className="btn-ink px-6 py-3 text-sm">
          {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Creando…</> : 'Crear tienda'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-outline px-5 py-3 text-sm">
          Cancelar
        </button>
      </div>
    </form>
  );
}
