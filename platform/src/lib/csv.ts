import Papa from 'papaparse';

/**
 * Lectura de CSV de marketplaces.
 *
 * Cada plataforma exporta con encabezados distintos y los cambia sin avisar,
 * así que NO se codifican formatos fijos. Se detecta por parecido de nombre y
 * el usuario siempre puede corregir el mapeo a mano; una vez corregido, se
 * guarda en el canal y no se vuelve a preguntar.
 *
 * Los archivos vienen de fuera: todo valor se trata como texto sin confianza
 * hasta validarlo.
 */

export type SalesField =
  | 'external_order_id' | 'sku' | 'quantity' | 'unit_price'
  | 'total' | 'date' | 'buyer_email' | 'buyer_name';

export type InventoryField = 'sku' | 'stock' | 'price';

export type ColumnMapping = Partial<Record<string, string>>;

/** Normaliza un encabezado para poder compararlo: "Seller-SKU " → "sellersku" */
function norm(header: string): string {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Nombres que suelen usar los marketplaces. Es una heurística para ahorrarle
 * trabajo al usuario en el caso común, nunca la última palabra: si acierta,
 * se ahorra el mapeo; si no, lo corrige en pantalla.
 */
const SALES_ALIASES: Record<SalesField, string[]> = {
  external_order_id: [
    'orderid', 'ordernumber', 'orderno', 'amazonorderid', 'purchaseordernumber',
    'customerorderid', 'ordenid', 'numerodeorden', 'numeropedido', 'pedido',
  ],
  sku: [
    'sku', 'sellersku', 'merchantsku', 'itemsku', 'productsku', 'skuvendedor',
    'codigo', 'clave', 'skuid',
  ],
  quantity: [
    'quantity', 'qty', 'quantitypurchased', 'quantityshipped', 'itemquantity',
    'cantidad', 'unidades', 'piezas',
  ],
  unit_price: [
    'itemprice', 'unitprice', 'price', 'productprice', 'preciounitario',
    'precio', 'unitcost',
  ],
  total: [
    'total', 'itemtotal', 'ordertotal', 'linetotal', 'totalamount',
    'importe', 'subtotal', 'grantotal',
  ],
  date: [
    'purchasedate', 'orderdate', 'date', 'createdat', 'datetime',
    'fecha', 'fechadecompra', 'fechapedido',
  ],
  buyer_email: ['buyeremail', 'customeremail', 'email', 'correo', 'correoelectronico'],
  buyer_name: [
    'buyername', 'customername', 'recipientname', 'shiptoname',
    'nombre', 'cliente', 'nombrecliente',
  ],
};

const INVENTORY_ALIASES: Record<InventoryField, string[]> = {
  sku: SALES_ALIASES.sku,
  stock: [
    'stock', 'quantity', 'qty', 'available', 'availablequantity', 'onhand',
    'inventory', 'existencias', 'cantidad', 'disponible', 'inventario',
  ],
  price: SALES_ALIASES.unit_price,
};

/**
 * Puntúa qué tan bien un encabezado corresponde a un campo.
 * Exacto > empieza por > contiene. Devuelve 0 si no hay relación.
 */
function score(header: string, aliases: string[]): number {
  const h = norm(header);
  if (!h) return 0;

  for (const alias of aliases) {
    if (h === alias) return 100;
  }
  for (const alias of aliases) {
    if (h.startsWith(alias) || alias.startsWith(h)) return 70;
  }
  for (const alias of aliases) {
    if (h.includes(alias) && alias.length >= 3) return 40;
  }
  return 0;
}

/** Propone un mapeo columna→campo. Cada columna se usa una sola vez. */
export function detectMapping(
  headers: string[],
  kind: 'sales' | 'inventory',
): ColumnMapping {
  const aliases: Record<string, string[]> =
    kind === 'sales' ? SALES_ALIASES : INVENTORY_ALIASES;

  const candidates: Array<{ field: string; header: string; points: number }> = [];

  for (const field of Object.keys(aliases)) {
    for (const header of headers) {
      const points = score(header, aliases[field]);
      if (points > 0) candidates.push({ field, header, points });
    }
  }

  // El de mayor puntaje se queda la columna; así "price" no se lleva a la vez
  // unit_price y total.
  candidates.sort((a, b) => b.points - a.points);

  const mapping: ColumnMapping = {};
  const usedHeaders = new Set<string>();

  for (const c of candidates) {
    if (mapping[c.field] || usedHeaders.has(c.header)) continue;
    mapping[c.field] = c.header;
    usedHeaders.add(c.header);
  }

  return mapping;
}

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
  error?: string;
}

/** Lee el texto del CSV. Papa detecta el separador: coma, punto y coma o tab. */
export function parseCsv(text: string, maxRows = 20_000): ParsedCsv {
  const result = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
    dynamicTyping: false,   // todo como texto: lo convertimos nosotros, validando
  });

  if (!result.data.length) {
    return { headers: [], rows: [], error: 'El archivo no tiene filas de datos.' };
  }
  if (result.data.length > maxRows) {
    return {
      headers: [],
      rows: [],
      error: `El archivo tiene ${result.data.length} filas; el máximo es ${maxRows}. Divídelo en partes.`,
    };
  }

  const headers = (result.meta.fields ?? []).filter(Boolean);
  if (headers.length === 0) {
    return { headers: [], rows: [], error: 'No se encontraron encabezados de columna.' };
  }

  return { headers, rows: result.data };
}

/* ── Conversión de valores ────────────────────────────────────────────────── */

/**
 * Dinero a centavos, tolerante con los formatos que traen los marketplaces:
 * "$1,299.50" · "1.299,50" · "USD 45.00" · "45"
 */
export function parseMoneyToCents(raw: string | undefined): number | null {
  if (!raw) return null;

  let s = String(raw).trim().replace(/[^\d.,-]/g, '');
  if (!s) return null;

  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');

  if (lastComma > -1 && lastDot > -1) {
    // El separador decimal es el que aparece más a la derecha.
    if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (lastComma > -1) {
    // Coma sola: decimal si deja 1 o 2 dígitos ("45,50"), si no es de miles.
    s = s.length - lastComma - 1 <= 2 ? s.replace(',', '.') : s.replace(/,/g, '');
  }

  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

export function parseIntSafe(raw: string | undefined): number | null {
  if (raw === undefined || raw === null) return null;
  const s = String(raw).trim().replace(/[^\d-]/g, '');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

/** Fecha tolerante. Si no se entiende, devuelve null y se usa la de hoy. */
export function parseDateSafe(raw: string | undefined): Date | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;

  const direct = new Date(s);
  if (!Number.isNaN(direct.getTime())) return direct;

  // DD/MM/YYYY vs MM/DD/YYYY: si el primer número pasa de 12, es el día.
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (m) {
    const [, a, b, y] = m;
    const year = Number(y.length === 2 ? `20${y}` : y);
    const first = Number(a);
    const second = Number(b);
    const [month, day] = first > 12 ? [second, first] : [first, second];
    const d = new Date(year, month - 1, day);
    if (!Number.isNaN(d.getTime())) return d;
  }

  return null;
}

/** Genera un CSV a partir de filas. Escapa comillas y separadores. */
export function toCsv(rows: Record<string, string | number | null>[]): string {
  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]);
  const escape = (v: string | number | null): string => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  return [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ].join('\r\n');
}
