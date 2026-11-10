const STYLES: Record<string, { label: string; className: string }> = {
  pending:   { label: 'Sin pagar',  className: 'bg-cream-deep text-ink-mute border-line' },
  paid:      { label: 'Por enviar', className: 'bg-[#A87A1E]/15 text-[#7A5A14] border-[#A87A1E]/40' },
  fulfilled: { label: 'Enviado',    className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  cancelled: { label: 'Cancelado',  className: 'bg-red-50 text-red-800 border-red-200' },
  refunded:  { label: 'Reembolsado',className: 'bg-red-50 text-red-800 border-red-200' },
};

/** El estado se comunica con texto, no solo con color. */
export function OrderStatusBadge({
  status,
  fulfillment,
}: {
  status: string;
  fulfillment?: string;
}) {
  const key = status === 'paid' && fulfillment === 'fulfilled' ? 'fulfilled' : status;
  const style = STYLES[key] ?? STYLES.pending;

  return (
    <span className={`inline-block border px-2 py-1 text-[0.7rem] ${style.className}`}>
      {style.label}
    </span>
  );
}
