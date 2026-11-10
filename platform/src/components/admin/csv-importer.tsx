'use client';

import { useRef, useState, useTransition } from 'react';
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react';

import {
  checkSkus, importInventory, importSales, saveChannelMapping,
  type ImportState,
} from '@/app/admin/(panel)/canales/actions';
import {
  detectMapping, parseCsv, parseDateSafe, parseIntSafe, parseMoneyToCents,
  type ColumnMapping,
} from '@/lib/csv';

interface Channel {
  id: string;
  name: string;
  type: string;
  csv_mapping: Record<string, ColumnMapping>;
}

const SALES_FIELDS: Array<{ key: string; label: string; required: boolean; hint?: string }> = [
  { key: 'sku',               label: 'SKU',             required: true,  hint: 'Para casar con tu catálogo' },
  { key: 'quantity',          label: 'Cantidad',        required: true },
  { key: 'external_order_id', label: 'ID del pedido',   required: false, hint: 'Evita duplicados al reimportar' },
  { key: 'unit_price',        label: 'Precio unitario', required: false, hint: 'Si falta, usa el de tu catálogo' },
  { key: 'date',              label: 'Fecha',           required: false },
  { key: 'buyer_name',        label: 'Cliente',         required: false },
  { key: 'buyer_email',       label: 'Correo',          required: false },
];

const INVENTORY_FIELDS: Array<{ key: string; label: string; required: boolean; hint?: string }> = [
  { key: 'sku',   label: 'SKU',         required: true },
  { key: 'stock', label: 'Existencias', required: true },
];

export function CsvImporter({ channels }: { channels: Channel[] }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  const [kind, setKind] = useState<'sales' | 'inventory'>('sales');
  const [mode, setMode] = useState<'absolute' | 'delta'>('absolute');
  const [channelId, setChannelId] = useState(channels[0]?.id ?? '');

  const [filename, setFilename] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [parseError, setParseError] = useState<string | null>(null);

  const [unmatched, setUnmatched] = useState<string[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<ImportState | null>(null);

  const fields = kind === 'sales' ? SALES_FIELDS : INVENTORY_FIELDS;
  const ready = fields.every((f) => !f.required || mapping[f.key]);

  function reset() {
    setFilename(null); setHeaders([]); setRows([]); setMapping({});
    setUnmatched(null); setParseError(null); setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  // El CSV se lee en el navegador: vista previa inmediata y al servidor solo
  // viajan las filas ya mapeadas, no el archivo entero.
  async function onFile(file: File) {
    reset();
    setFilename(file.name);

    const text = await file.text();
    const parsed = parseCsv(text);

    if (parsed.error) { setParseError(parsed.error); return; }

    setHeaders(parsed.headers);
    setRows(parsed.rows);

    const channel = channels.find((c) => c.id === channelId);
    const saved = channel?.csv_mapping?.[kind];
    // El mapeo guardado solo sirve si sus columnas siguen en el archivo.
    const savedIsValid =
      saved && Object.values(saved).every((h) => !h || parsed.headers.includes(h));

    setMapping(savedIsValid ? saved : detectMapping(parsed.headers, kind));
  }

  function verifySkus() {
    const col = mapping.sku;
    if (!col) return;

    setChecking(true);
    const skus = [...new Set(rows.map((r) => (r[col] ?? '').trim()).filter(Boolean))];

    startTransition(async () => {
      const res = await checkSkus(channelId, skus);
      setUnmatched(res.unmatched);
      setChecking(false);
    });
  }

  function runImport() {
    setResult(null);

    startTransition(async () => {
      await saveChannelMapping(channelId, kind, mapping);

      if (kind === 'sales') {
        const payload = rows
          .map((r) => {
            const sku = (r[mapping.sku!] ?? '').trim();
            const quantity = parseIntSafe(r[mapping.quantity!]) ?? 0;
            if (!sku || quantity <= 0) return null;

            const date = mapping.date ? parseDateSafe(r[mapping.date]) : null;

            return {
              sku,
              quantity,
              external_order_id: mapping.external_order_id
                ? (r[mapping.external_order_id] ?? '').trim() || undefined
                : undefined,
              unit_price_cents: mapping.unit_price
                ? parseMoneyToCents(r[mapping.unit_price])
                : null,
              date: date ? date.toISOString() : undefined,
              buyer_email: mapping.buyer_email ? (r[mapping.buyer_email] ?? '').trim() || undefined : undefined,
              buyer_name: mapping.buyer_name ? (r[mapping.buyer_name] ?? '').trim() || undefined : undefined,
            };
          })
          .filter((r): r is NonNullable<typeof r> => r !== null);

        if (payload.length === 0) {
          setResult({ error: 'Ninguna fila tiene SKU y cantidad válidos.' });
          return;
        }
        setResult(await importSales({ channel_id: channelId, filename: filename ?? undefined, rows: payload }));
      } else {
        const payload = rows
          .map((r) => {
            const sku = (r[mapping.sku!] ?? '').trim();
            const stock = parseIntSafe(r[mapping.stock!]);
            if (!sku || stock === null) return null;
            return { sku, stock };
          })
          .filter((r): r is NonNullable<typeof r> => r !== null);

        if (payload.length === 0) {
          setResult({ error: 'Ninguna fila tiene SKU y existencias válidos.' });
          return;
        }
        setResult(await importInventory({
          channel_id: channelId, filename: filename ?? undefined, mode, rows: payload,
        }));
      }
    });
  }

  return (
    <section className="border border-line/60 bg-white">
      <div className="border-b border-line/50 px-6 py-4">
        <h2 className="font-display text-lg">Importar archivo</h2>
        <p className="mt-1 text-xs text-ink-mute">
          Sube el reporte que te da Amazon, Walmart o TikTok Shop. Antes de
          tocar nada te decimos qué va a pasar.
        </p>
      </div>

      <div className="space-y-5 p-6">
        {/* ── Qué y de dónde ─────────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="kind" className="label">Qué vas a importar</label>
            <select
              id="kind" value={kind}
              onChange={(e) => { setKind(e.target.value as 'sales' | 'inventory'); reset(); }}
              className="field"
            >
              <option value="sales">Ventas (descuenta inventario)</option>
              <option value="inventory">Existencias (actualiza stock)</option>
            </select>
          </div>

          <div>
            <label htmlFor="channel" className="label">Canal</label>
            <select
              id="channel" value={channelId}
              onChange={(e) => { setChannelId(e.target.value); setUnmatched(null); }}
              className="field"
            >
              {channels.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {kind === 'inventory' && (
          <fieldset>
            <legend className="label">Cómo interpretar la columna de existencias</legend>
            <div className="flex flex-wrap gap-3">
              {[
                { v: 'absolute', t: 'Es el total que hay', h: '"40" deja el stock en 40' },
                { v: 'delta', t: 'Es lo que entró o salió', h: '"12" suma 12 al stock actual' },
              ].map((o) => (
                <label
                  key={o.v}
                  className={`flex-1 cursor-pointer border px-4 py-3 text-sm ${
                    mode === o.v ? 'border-ink bg-cream-deep/40' : 'border-line'
                  }`}
                >
                  <input
                    type="radio" name="mode" value={o.v} checked={mode === o.v}
                    onChange={() => setMode(o.v as 'absolute' | 'delta')}
                    className="sr-only"
                  />
                  <span className="font-medium">{o.t}</span>
                  <span className="mt-0.5 block text-xs text-ink-mute">{o.h}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {/* ── Archivo ────────────────────────────────────────────────────── */}
        <div>
          <label htmlFor="csv" className="label">Archivo CSV</label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileRef} id="csv" type="file"
              accept=".csv,text/csv,text/plain,.tsv"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); }}
              className="field file:mr-3 file:border-0 file:bg-ink file:px-4 file:py-1.5 file:text-xs file:text-cream"
            />
            {filename && (
              <button onClick={reset} className="btn-ghost text-xs" type="button">
                <X className="h-3.5 w-3.5" aria-hidden /> Quitar
              </button>
            )}
          </div>
        </div>

        {parseError && (
          <p role="alert" className="border-l-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">
            {parseError}
          </p>
        )}

        {/* ── Mapeo ──────────────────────────────────────────────────────── */}
        {headers.length > 0 && (
          <>
            <div className="border-t border-line/40 pt-5">
              <div className="mb-3 flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-ink-mute" strokeWidth={1.5} aria-hidden />
                <h3 className="text-sm font-medium">
                  {rows.length} fila{rows.length === 1 ? '' : 's'} · {headers.length} columnas
                </h3>
              </div>
              <p className="mb-4 text-xs text-ink-mute">
                Detectamos las columnas automáticamente. Corrige lo que haga
                falta; la próxima vez lo recordamos.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {fields.map((f) => (
                  <div key={f.key}>
                    <label htmlFor={`map-${f.key}`} className="label">
                      {f.label} {f.required && <span className="text-red-600">*</span>}
                    </label>
                    <select
                      id={`map-${f.key}`}
                      value={mapping[f.key] ?? ''}
                      onChange={(e) => {
                        setMapping((m) => ({ ...m, [f.key]: e.target.value || undefined }));
                        setUnmatched(null);
                      }}
                      className="field py-2"
                    >
                      <option value="">— sin asignar —</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                    {f.hint && <p className="mt-1 text-[0.7rem] text-ink-mute">{f.hint}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Vista previa ─────────────────────────────────────────────── */}
            {mapping.sku && (
              <div className="border-t border-line/40 pt-5">
                <h3 className="mb-3 text-sm font-medium">Primeras filas</h3>
                <div className="overflow-x-auto border border-line/50">
                  <table className="w-full text-xs">
                    <thead className="bg-cream-deep/40 text-left">
                      <tr>
                        {fields.filter((f) => mapping[f.key]).map((f) => (
                          <th key={f.key} className="px-3 py-2 font-medium">{f.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/30">
                      {rows.slice(0, 4).map((r, i) => (
                        <tr key={i}>
                          {fields.filter((f) => mapping[f.key]).map((f) => (
                            <td key={f.key} className="px-3 py-2 tabular-nums">
                              {r[mapping[f.key]!] || <span className="text-ink-mute">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button" onClick={verifySkus} disabled={checking || pending}
                  className="btn-outline mt-4 px-5 py-2.5 text-sm"
                >
                  {checking ? <><Loader2 className="h-4 w-4 animate-spin" /> Revisando…</>
                            : 'Revisar SKU contra mi catálogo'}
                </button>
              </div>
            )}

            {/* ── Resultado de la revisión ─────────────────────────────────── */}
            {unmatched !== null && (
              unmatched.length === 0 ? (
                <p className="flex items-start gap-2.5 border-l-2 border-emerald-600 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
                  Todos los SKU existen en tu catálogo. Puedes importar.
                </p>
              ) : (
                <div className="border-l-2 border-[#A87A1E] bg-[#A87A1E]/10 px-4 py-3">
                  <p className="flex items-start gap-2.5 text-sm">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#A87A1E]" strokeWidth={1.6} aria-hidden />
                    <span>
                      <strong>{unmatched.length} SKU no están en tu catálogo.</strong>{' '}
                      Esas filas se van a omitir. Agrégalos como producto, o
                      mapea su SKU de este canal más abajo.
                    </span>
                  </p>
                  <ul className="mt-2.5 flex flex-wrap gap-1.5 pl-7">
                    {unmatched.slice(0, 25).map((sku) => (
                      <li key={sku} className="bg-white px-2 py-0.5 font-mono text-[0.7rem]">
                        {sku}
                      </li>
                    ))}
                    {unmatched.length > 25 && (
                      <li className="px-2 py-0.5 text-[0.7rem] text-ink-mute">
                        y {unmatched.length - 25} más
                      </li>
                    )}
                  </ul>
                </div>
              )
            )}

            {/* ── Importar ─────────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3 border-t border-line/40 pt-5">
              <button
                type="button" onClick={runImport} disabled={!ready || pending}
                className="btn-ink px-6 py-3 text-sm"
              >
                {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Importando…</>
                         : <><Upload className="h-4 w-4" aria-hidden /> Importar {rows.length} filas</>}
              </button>

              {!ready && (
                <span className="text-xs text-ink-mute">
                  Falta asignar las columnas obligatorias.
                </span>
              )}
              {kind === 'sales' && (
                <span className="text-xs text-ink-mute">
                  Se descontará el inventario de cada SKU.
                </span>
              )}
            </div>
          </>
        )}

        {/* ── Resultado ──────────────────────────────────────────────────── */}
        {result?.error && (
          <p role="alert" className="border-l-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">
            {result.error}
          </p>
        )}

        {result?.ok && (
          <div className="border-l-2 border-emerald-600 bg-emerald-50 px-4 py-3">
            <p className="text-sm text-emerald-900">{result.ok}</p>

            {result.issues && result.issues.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-emerald-900 underline">
                  Ver {result.issues.length} fila(s) con problemas
                </summary>
                <ul className="mt-2 space-y-1 text-[0.7rem] text-ink-mute">
                  {result.issues.map((iss, i) => (
                    <li key={i}>
                      {iss.row > 0 && `Fila ${iss.row} · `}
                      <span className="font-mono">{iss.sku}</span> — {iss.reason}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
