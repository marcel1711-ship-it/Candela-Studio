'use client';

import { useState, useTransition } from 'react';
import { Check, Truck } from 'lucide-react';

import { cancelOrder, fulfillOrder } from '@/app/admin/(panel)/pedidos/actions';
import type { OrderWithItems } from '@/lib/types';

const CARRIERS = ['USPS', 'UPS', 'FedEx', 'DHL', 'Otro'];

export function FulfillPanel({ order }: { order: OrderWithItems }) {
  const [pending, startTransition] = useTransition();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const done = order.fulfillment_status === 'fulfilled';
  const closed = order.status === 'cancelled' || order.status === 'refunded';

  if (closed) {
    return (
      <section className="border border-line/60 bg-white p-6">
        <h2 className="font-display text-lg">Envío</h2>
        <p className="mt-2 text-sm text-ink-mute">
          Este pedido está {order.status === 'cancelled' ? 'cancelado' : 'reembolsado'}.
        </p>
      </section>
    );
  }

  if (order.status === 'pending') {
    return (
      <section className="border border-line/60 bg-white p-6">
        <h2 className="font-display text-lg">Envío</h2>
        <p className="mt-2 text-sm text-ink-mute">
          El pedido todavía no se ha pagado. Podrás marcarlo como enviado en
          cuanto Stripe confirme el pago.
        </p>
      </section>
    );
  }

  if (done) {
    return (
      <section className="border border-line/60 bg-white p-6">
        <h2 className="flex items-center gap-2 font-display text-lg">
          <Check className="h-4 w-4 text-emerald-700" strokeWidth={2} aria-hidden />
          Enviado
        </h2>

        <dl className="mt-4 space-y-2 text-sm">
          {order.carrier && (
            <div className="flex justify-between">
              <dt className="text-ink-mute">Paquetería</dt>
              <dd>{order.carrier}</dd>
            </div>
          )}
          {order.tracking_number && (
            <div className="flex justify-between gap-3">
              <dt className="text-ink-mute">Rastreo</dt>
              <dd className="break-all text-right font-mono text-xs">{order.tracking_number}</dd>
            </div>
          )}
          {order.fulfilled_at && (
            <div className="flex justify-between">
              <dt className="text-ink-mute">Fecha</dt>
              <dd>{new Date(order.fulfilled_at).toLocaleDateString()}</dd>
            </div>
          )}
        </dl>

        {order.tracking_url && (
          <a
            href={order.tracking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline mt-5 w-full py-2.5 text-sm"
          >
            Ver seguimiento
          </a>
        )}
      </section>
    );
  }

  return (
    <section className="border border-line/60 bg-white p-6">
      <h2 className="flex items-center gap-2 font-display text-lg">
        <Truck className="h-4 w-4 text-ink-mute" strokeWidth={1.5} aria-hidden />
        Marcar como enviado
      </h2>
      <p className="mt-1 text-xs text-ink-mute">
        Registra la guía para que el cliente pueda rastrear su pedido.
      </p>

      <form
        action={(formData) => startTransition(() => void fulfillOrder(order.id, formData))}
        className="mt-5 space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="carrier" className="label">Paquetería</label>
            <select id="carrier" name="carrier" className="field" defaultValue="USPS">
              {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="tracking_number" className="label">Número de guía</label>
            <input
              id="tracking_number" name="tracking_number"
              className="field font-mono text-xs" placeholder="9400 1000 0000 …"
            />
          </div>
        </div>

        <div>
          <label htmlFor="tracking_url" className="label">Enlace de seguimiento</label>
          <input
            id="tracking_url" name="tracking_url" type="url"
            className="field text-xs" placeholder="https://tools.usps.com/…"
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <button type="submit" disabled={pending} className="btn-ink px-6 py-2.5 text-sm">
            {pending ? 'Guardando…' : 'Marcar como enviado'}
          </button>

          {!confirmCancel ? (
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              className="btn-ghost text-sm"
            >
              Cancelar pedido
            </button>
          ) : (
            <span className="flex items-center gap-2 text-xs">
              <span className="text-ink-mute">¿Cancelar y devolver stock?</span>
              <button
                type="button"
                onClick={() => startTransition(() => void cancelOrder(order.id, true))}
                className="bg-red-700 px-3 py-1.5 text-white"
              >
                Sí, cancelar
              </button>
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                className="px-2 py-1.5 text-ink-mute"
              >
                No
              </button>
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
