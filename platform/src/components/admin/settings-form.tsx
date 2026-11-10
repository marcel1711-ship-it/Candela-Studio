'use client';

import { useActionState } from 'react';
import { Loader2 } from 'lucide-react';

import { saveSettings, type SettingsState } from '@/app/admin/(panel)/configuracion/actions';
import type { MemberRole, Store } from '@/lib/types';

export function SettingsForm({ store }: { store: Store & { role: MemberRole } }) {
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(
    saveSettings,
    {},
  );

  return (
    <form action={formAction} className="space-y-6">
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

      <section className="space-y-4 border border-line/60 bg-white p-6">
        <h2 className="font-display text-lg">Tu tienda</h2>

        <div>
          <label htmlFor="name" className="label">Nombre *</label>
          <input id="name" name="name" required defaultValue={store.name} className="field" />
        </div>

        <div>
          <label htmlFor="tagline" className="label">
            Lema
            <span className="ml-2 normal-case tracking-normal text-ink-mute/70">
              bajo el logo
            </span>
          </label>
          <input
            id="tagline" name="tagline" maxLength={120}
            defaultValue={store.tagline ?? ''} className="field"
            placeholder="Perfumes árabes e italianos"
          />
        </div>

        <div>
          <label htmlFor="description" className="label">Descripción</label>
          <textarea
            id="description" name="description" rows={3} maxLength={600}
            defaultValue={store.description ?? ''} className="field resize-y"
          />
        </div>
      </section>

      <section className="space-y-4 border border-line/60 bg-white p-6">
        <h2 className="font-display text-lg">Contacto</h2>
        <p className="text-xs text-ink-mute">Aparece en el pie de página de tu tienda.</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="support_email" className="label">Correo</label>
            <input
              id="support_email" name="support_email" type="email"
              defaultValue={store.support_email ?? ''} className="field"
            />
          </div>
          <div>
            <label htmlFor="support_phone" className="label">Teléfono</label>
            <input
              id="support_phone" name="support_phone"
              defaultValue={store.support_phone ?? ''} className="field"
            />
          </div>
        </div>

        <div>
          <label htmlFor="whatsapp_number" className="label">WhatsApp</label>
          <input
            id="whatsapp_number" name="whatsapp_number"
            defaultValue={store.whatsapp_number ?? ''} className="field"
            placeholder="+1 305 555 0100"
          />
        </div>
      </section>

      {/* ── Alertas ──────────────────────────────────────────────────────── */}
      <section className="space-y-4 border border-line/60 bg-white p-6">
        <h2 className="font-display text-lg">Alertas de inventario</h2>

        <div>
          <label htmlFor="low_stock_threshold" className="label">
            Avisarme cuando queden o menos
          </label>
          <input
            id="low_stock_threshold" name="low_stock_threshold"
            type="number" min={0} max={10000} required
            defaultValue={store.low_stock_threshold}
            className="field w-32 tabular-nums"
          />
          <p className="mt-1.5 text-xs text-ink-mute">
            Valor general de la tienda. Cada producto puede tener el suyo propio
            si lo necesita.
          </p>
        </div>

        <div>
          <label htmlFor="alert_emails" className="label">Enviar alertas a</label>
          <input
            id="alert_emails" name="alert_emails"
            defaultValue={(store.alert_emails ?? []).join(', ')}
            className="field"
            placeholder="tu@negocio.com, bodega@negocio.com"
          />
          <p className="mt-1.5 text-xs text-ink-mute">
            Separa varios correos con comas. Enviamos un solo resumen diario,
            no un correo por producto.
          </p>
        </div>
      </section>

      <button type="submit" disabled={pending} className="btn-ink px-7 py-3">
        {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</> : 'Guardar cambios'}
      </button>
    </form>
  );
}
