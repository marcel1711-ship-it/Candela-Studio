import { NextResponse, type NextRequest } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Resumen diario de stock bajo, una vez por tienda.
 *
 * Por qué un resumen y no un correo por alerta: el trigger de la base dispara
 * en el instante en que el stock cruza el umbral, y una venta de 20 unidades
 * puede cruzar seis productos a la vez. Un correo por producto sería ruido que
 * el cliente terminaría silenciando — y entonces la alerta no sirve de nada.
 *
 * Programar en Vercel (vercel.json):
 *   { "crons": [{ "path": "/api/cron/stock-alerts", "schedule": "0 14 * * *" }] }
 */
export async function GET(request: NextRequest) {
  // Vercel Cron manda este header; el secreto cubre invocaciones manuales.
  const auth = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const db = createAdminClient();

  const { data: alerts, error } = await db
    .from('stock_alerts')
    .select(`
      id, store_id, threshold, stock_at_alert,
      store:stores(id, name, slug, alert_emails, status),
      variant:product_variants(name, sku, stock, product:products(name))
    `)
    .eq('status', 'open')
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type AlertRow = {
    id: string; store_id: string; threshold: number;
    store: { id: string; name: string; slug: string; alert_emails: string[]; status: string } | null;
    variant: { name: string; sku: string | null; stock: number;
               product: { name: string } | null } | null;
  };

  const rows = (alerts ?? []) as unknown as AlertRow[];

  // Agrupamos por tienda: un correo por cliente, no uno por producto.
  const byStore = new Map<string, AlertRow[]>();
  for (const row of rows) {
    if (!row.store || row.store.status === 'suspended') continue;
    if (!row.store.alert_emails?.length) continue;
    byStore.set(row.store_id, [...(byStore.get(row.store_id) ?? []), row]);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ALERTS_FROM_EMAIL ?? 'Candela <alertas@wearecandela.com>';

  let sent = 0;
  const notifiedIds: string[] = [];

  for (const [, group] of byStore) {
    const store = group[0].store!;

    const items = group
      .map((a) => {
        const name = a.variant?.product?.name ?? 'Producto';
        const variant =
          a.variant?.name && a.variant.name !== 'Única' ? ` (${a.variant.name})` : '';
        return `<tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee">${name}${variant}</td>
          <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-weight:600;color:${
            (a.variant?.stock ?? 0) <= 0 ? '#b91c1c' : '#A87A1E'
          }">${a.variant?.stock ?? 0} u.</td>
        </tr>`;
      })
      .join('');

    const html = `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#171210">
        <h1 style="font-size:20px;margin:0 0 4px">Stock bajo en ${store.name}</h1>
        <p style="color:#7A6A5D;font-size:14px;margin:0 0 20px">
          ${group.length} producto${group.length === 1 ? '' : 's'} por debajo del umbral que configuraste.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">${items}</table>
        <p style="margin:24px 0 0">
          <a href="https://${store.slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'wearecandela.com'}/admin/inventario"
             style="background:#171210;color:#FAF5EC;padding:12px 20px;text-decoration:none;display:inline-block;font-size:14px">
            Reponer inventario
          </a>
        </p>
      </div>`;

    if (apiKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to: store.alert_emails,
            subject: `${group.length} producto${group.length === 1 ? '' : 's'} con stock bajo · ${store.name}`,
            html,
          }),
        });

        if (res.ok) {
          sent += 1;
          notifiedIds.push(...group.map((a) => a.id));
        } else {
          console.error('[cron] Resend rechazó el envío:', await res.text());
        }
      } catch (err) {
        console.error('[cron] Error enviando a', store.slug, err);
      }
    }
  }

  // Marcamos 'notified' solo lo que de verdad salió: si el correo falló, la
  // alerta sigue 'open' y se reintenta mañana en vez de perderse.
  if (notifiedIds.length > 0) {
    await db
      .from('stock_alerts')
      .update({ status: 'notified', notified_at: new Date().toISOString() })
      .in('id', notifiedIds);
  }

  return NextResponse.json({
    stores_notified: sent,
    alerts_total: rows.length,
    alerts_marked: notifiedIds.length,
    email_configured: Boolean(apiKey),
  });
}
