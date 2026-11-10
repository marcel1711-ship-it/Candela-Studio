'use client';

import { useActionState, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { createCoupon, type CouponState } from '@/app/admin/(panel)/cupones/actions';

export function CouponForm({ currency }: { currency: string }) {
  const [state, formAction, pending] = useActionState<CouponState, FormData>(
    createCoupon,
    {},
  );
  const [type, setType] = useState<'percent' | 'fixed'>('percent');

  return (
    <form action={formAction} className="space-y-4 border border-line/60 bg-white p-6">
      <h2 className="font-display text-lg">Nuevo cupón</h2>

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="code" className="label">Código *</label>
          <input
            id="code" name="code" required maxLength={40}
            className="field font-mono uppercase" placeholder="BIENVENIDO10"
          />
        </div>

        <div>
          <label htmlFor="type" className="label">Tipo</label>
          <select
            id="type" name="type" value={type}
            onChange={(e) => setType(e.target.value as 'percent' | 'fixed')}
            className="field"
          >
            <option value="percent">Porcentaje</option>
            <option value="fixed">Monto fijo</option>
          </select>
        </div>

        <div>
          <label htmlFor="value" className="label">
            {type === 'percent' ? 'Porcentaje *' : `Monto * (${currency})`}
          </label>
          <input
            id="value" name="value" required inputMode="decimal"
            className="field tabular-nums"
            placeholder={type === 'percent' ? '10' : '15.00'}
          />
        </div>

        <div>
          <label htmlFor="min_subtotal" className="label">Compra mínima</label>
          <input
            id="min_subtotal" name="min_subtotal" inputMode="decimal"
            className="field tabular-nums" placeholder="opcional"
          />
        </div>

        <div>
          <label htmlFor="max_redemptions" className="label">Usos máximos</label>
          <input
            id="max_redemptions" name="max_redemptions" type="number" min={1}
            className="field tabular-nums" placeholder="ilimitado"
          />
        </div>

        <div>
          <label htmlFor="ends_at" className="label">Vence el</label>
          <input id="ends_at" name="ends_at" type="date" className="field" />
        </div>
      </div>

      <button type="submit" disabled={pending} className="btn-ink px-6 py-2.5 text-sm">
        {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Creando…</> : 'Crear cupón'}
      </button>
    </form>
  );
}
