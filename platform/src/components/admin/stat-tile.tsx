import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

/**
 * Titular numérico. Deliberadamente NO es una gráfica: un solo valor se lee
 * mejor como número grande que como barra de un elemento.
 */
export function StatTile({
  label,
  value,
  change,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  change?: number | null;
  hint?: string;
  tone?: 'neutral' | 'warn';
}) {
  const dir = change == null ? null : change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'flat';

  return (
    <div className="border border-line/60 bg-white p-5">
      <p className="text-[0.7rem] uppercase tracking-wideish text-ink-mute">{label}</p>

      <p
        className={`mt-2 font-display text-3xl tabular-nums ${
          tone === 'warn' && value !== '0' ? 'text-[#A87A1E]' : 'text-ink'
        }`}
      >
        {value}
      </p>

      {dir && (
        <p
          className={`mt-2 flex items-center gap-1 text-xs tabular-nums ${
            dir === 'up' ? 'text-emerald-700' : dir === 'down' ? 'text-red-700' : 'text-ink-mute'
          }`}
        >
          {dir === 'up' && <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />}
          {dir === 'down' && <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />}
          {dir === 'flat' && <Minus className="h-3.5 w-3.5" aria-hidden />}
          {change! > 0 ? '+' : ''}{change!.toFixed(1)}%
          <span className="text-ink-mute">vs. periodo anterior</span>
        </p>
      )}

      {hint && !dir && <p className="mt-2 text-xs text-ink-mute">{hint}</p>}
    </div>
  );
}
