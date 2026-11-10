/**
 * Dinero: SIEMPRE enteros en centavos, nunca float.
 * 0.1 + 0.2 !== 0.3 y un centavo perdido por pedido es una conciliación rota.
 */

export function formatMoney(
  cents: number,
  currency = 'USD',
  locale = 'es-US',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/** "19.99" | 19.99 → 1999 */
export function toCents(value: string | number): number {
  const n = typeof value === 'string' ? Number(value.replace(/[^0-9.-]/g, '')) : value;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** 1999 → "19.99" (para inputs de formulario) */
export function fromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Variación porcentual entre dos periodos, protegida contra división por cero. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export function discountPercent(priceCents: number, compareAtCents: number | null): number | null {
  if (!compareAtCents || compareAtCents <= priceCents) return null;
  return Math.round(((compareAtCents - priceCents) / compareAtCents) * 100);
}
