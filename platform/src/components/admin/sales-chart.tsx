'use client';

import { useState } from 'react';
import { formatMoney } from '@/lib/money';

/**
 * Ventas por día. Una sola serie, así que no lleva leyenda: el título la nombra.
 * Etiquetas directas solo en el máximo — un número sobre cada barra sería ruido.
 */

const SERIES = '#A87A1E'; // dorado de marca, validado contra superficie blanca

export interface SalesPoint {
  day: string;
  revenue_cents: number;
  orders: number;
}

export function SalesChart({
  data,
  currency,
  locale,
}: {
  data: SalesPoint[];
  currency: string;
  locale: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const max = Math.max(...data.map((d) => d.revenue_cents), 1);
  const total = data.reduce((sum, d) => sum + d.revenue_cents, 0);
  const peakIndex = data.reduce(
    (best, d, i) => (d.revenue_cents > data[best].revenue_cents ? i : best),
    0,
  );

  const fmtDay = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' });

  if (total === 0) {
    return (
      <div className="border border-line/60 bg-white p-6">
        <h2 className="font-display text-lg">Ventas por día</h2>
        <p className="mt-10 pb-10 text-center text-sm text-ink-mute">
          Aún no hay ventas registradas en este periodo.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-line/60 bg-white p-6">
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-lg">Ventas por día</h2>
        <span className="text-xs text-ink-mute">últimos {data.length} días</span>
      </div>

      <div className="flex h-44 items-end gap-[2px]" role="img"
           aria-label={`Ventas diarias de los últimos ${data.length} días. Total ${formatMoney(total, currency, locale)}.`}>
        {data.map((point, i) => {
          const pct = (point.revenue_cents / max) * 100;
          const active = hover === i;

          return (
            <div
              key={point.day}
              className="relative flex h-full flex-1 cursor-default items-end"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {/* Zona de hover de altura completa: el objetivo es más grande
                  que la barra, que puede medir 2px en un día flojo. */}
              <div className="absolute inset-0" aria-hidden />

              <div
                className="w-full rounded-t-[4px] transition-opacity"
                style={{
                  height: `${Math.max(pct, point.revenue_cents > 0 ? 2 : 0)}%`,
                  backgroundColor: SERIES,
                  opacity: hover === null || active ? 1 : 0.45,
                }}
              />

              {active && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max -translate-x-1/2 border border-line bg-white px-3 py-2 text-xs shadow-lift">
                  <p className="font-medium text-ink">{fmtDay(point.day)}</p>
                  <p className="mt-0.5 tabular-nums text-ink">
                    {formatMoney(point.revenue_cents, currency, locale)}
                  </p>
                  <p className="tabular-nums text-ink-mute">
                    {point.orders} pedido{point.orders === 1 ? '' : 's'}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between text-[0.7rem] text-ink-mute">
        <span>{fmtDay(data[0].day)}</span>
        <span className="tabular-nums">
          Máx. {formatMoney(data[peakIndex].revenue_cents, currency, locale)}
        </span>
        <span>{fmtDay(data[data.length - 1].day)}</span>
      </div>
    </div>
  );
}
