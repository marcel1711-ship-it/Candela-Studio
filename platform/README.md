# Candela Hub

Plataforma de ecommerce **multi-tenant** para Candela Studio: un solo código y
una sola base de datos sirven a todas las tiendas de los clientes, cada una con
su dominio, su marca y su panel.

> **No hay registro público.** Candela provisiona cada tienda y entrega los
> accesos. Es una decisión de producto, no una funcionalidad pendiente: evita
> que un vendedor fraudulento ponga en riesgo la cuenta de plataforma de Stripe
> —y con ella, el cobro de todos los clientes reales.

---

## Stack

| Pieza | Qué resuelve |
|---|---|
| Next.js 15 (App Router) | SSR/ISR: las fichas de producto son HTML indexable |
| Supabase (Postgres + Auth + Storage) | Datos, sesiones e imágenes, con RLS |
| Stripe Connect (cuentas Standard) | Cada cliente cobra en SU cuenta |
| Tailwind | Sistema de diseño con tema por tenant |

---

## Arranque local

```bash
npm install
```

```bash
cp .env.example .env.local
```

Llena `.env.local` (las llaves salen de Supabase → Settings → API y de Stripe →
Developers). Después:

```bash
npm run dev
```

En `localhost` la tienda se resuelve con `DEV_STORE_SLUG`.

### Base de datos

Corre las migraciones **en orden** en el SQL Editor de Supabase:

| Archivo | Contenido |
|---|---|
| `0001_init.sql` | Tablas. Toda tabla de negocio lleva `store_id` |
| `0002_rls.sql` | Row Level Security: el aislamiento real entre tiendas |
| `0003_inventory.sql` | Inventario atómico, folios, alertas, métricas |
| `0004_seed_demo.sql` | Tienda de demostración (opcional) |

Luego da acceso a una cuenta con `scripts/bootstrap-admin.sql`.

---

## Decisiones que conviene no deshacer

**El inventario solo vive en `product_variants`.** Todo producto tiene al menos
una variante ("Única"). Una sola fuente de verdad para el stock.

**El stock se mueve solo por funciones de base de datos.** `adjust_variant_stock`
y `apply_order_inventory` escriben también en `inventory_movements`, así que la
bitácora nunca se desfasa de la realidad. Nada en la aplicación hace
`update ... set stock = ...` a mano.

**El descuento de inventario ocurre en el webhook, no en el checkout.** Con lock
de fila y en orden estable de variante: dos compras simultáneas se serializan en
vez de vender la misma última unidad dos veces. La bandera `inventory_applied` lo
hace idempotente frente a los reintentos de Stripe.

**Los precios salen de la base, nunca del navegador.** El carrito manda ids y
cantidades; el servidor recalcula todo. Editar `localStorage` no cambia lo que se
cobra.

**Nunca guardamos llaves de Stripe de los clientes.** Solo el `acct_...` que
devuelve el OAuth de Connect. El dinero va directo a la cuenta del comerciante y
las disputas son suyas, no de Candela.

**Los productos se archivan, no se borran.** Borrar dejaría pedidos históricos
sin referencia y falsearía los reportes de meses anteriores.

---

## Seguridad

- **RLS activo en todas las tablas.** Es la red que atrapa un `store_id`
  olvidado en el código.
- **`service_role` solo en servidor**, en los pocos lugares sin sesión de
  usuario (webhook, checkout público, resolución de tenant, cron). Cada consulta
  ahí filtra `store_id` a mano. `src/lib/supabase/admin.ts` importa `server-only`
  para que el build falle si alguien lo arrastra al navegador.
- **El panel vive aparte del storefront**, con `noindex` y sin caché. El
  middleware corta el acceso antes de renderizar; RLS decide qué filas se ven.
- **Webhook con firma verificada** sobre el cuerpo crudo.
- **`state` en el OAuth de Connect** atado al id de la tienda, contra CSRF.
- **Bitácora de auditoría** de cambios de precio, stock y pedidos.

### Antes de producción

- [ ] 2FA obligatorio para las cuentas del panel (Supabase Auth → MFA)
- [ ] Rotar `SUPABASE_SERVICE_ROLE_KEY` si estuvo en algún lado compartido
- [ ] Webhook de Stripe apuntando a `/api/stripe/webhook`, **con eventos de
      cuentas conectadas activados** (Connect)
- [ ] `CRON_SECRET` configurado y cron diario corriendo
- [ ] Revisar Stripe Tax para impuestos de venta en EE. UU.
- [ ] Confirmar restricciones de envío: las fragancias con alcohol son
      mercancía limitada (ORM-D) y normalmente viajan solo por tierra

---

## Alertas de stock bajo

Cadena completa:

1. El cliente define el umbral en **Configuración** (general) y puede afinarlo
   por producto o por presentación.
2. Un trigger en `product_variants` abre una alerta en cuanto el stock cruza el
   umbral. Un índice parcial garantiza **una sola alerta viva por variante**.
3. El cron diario (`/api/cron/stock-alerts`) manda **un resumen por tienda**, no
   un correo por producto: una venta grande puede cruzar seis umbrales a la vez,
   y seis correos se convierten en ruido que el cliente silencia.
4. Si el stock se repone, la alerta se cierra sola y puede volver a dispararse.

---

## Multicanal por CSV

El cliente vende en su web, en Amazon, en Walmart y en TikTok Shop. El dolor
real no es publicar desde un solo lugar: es **vender el mismo producto en dos
lados teniendo uno**. Esto se resuelve sin tocar ninguna API.

**Entrada** — se sube el reporte de ventas del marketplace en *Canales →
Importar*. El CSV se lee en el navegador, se detectan las columnas solas
(también en español), el usuario corrige lo que haga falta y el mapeo queda
guardado para la próxima. Antes de importar, el sistema dice **qué SKU no
existen en el catálogo**, que es lo único que hace fallar una conciliación.

**Salida** — *Descargar inventario* genera el CSV de existencias para cargarlo
de vuelta en el marketplace. Si el canal tiene `stock_buffer`, se resta: es el
colchón contra la sobreventa, porque ningún marketplace refleja el stock al
instante.

**Garantías:**

- Reimportar el mismo reporte **no duplica nada**. El índice único
  `(store_id, channel_id, external_order_id)` lo impide.
- Toda importación queda en `import_batches` y se puede **revertir**: cancela
  sus pedidos y devuelve el inventario. Revertir dos veces no infla el stock.
- Las ventas importadas descuentan por el **mismo camino atómico** que una
  venta de la web (`apply_order_inventory`), así que disparan las alertas de
  stock bajo igual que cualquier otra.
- Cada marketplace puede tener **su propio SKU** para el mismo producto
  (`channel_listings`); si no hay mapeo, se usa el SKU del catálogo.

El siguiente escalón —integración por API— reutiliza estas mismas tablas:
`channel_listings.external_id` ya está ahí esperando el ASIN o el item id.

---

## Agregar una tienda nueva

1. `insert into stores (...)` con su `slug` y su `theme`.
2. Registrar al cliente en Supabase Auth y darle `owner` con
   `scripts/bootstrap-admin.sql`.
3. Apuntar el dominio a Vercel y registrarlo en `store_domains` con
   `verified_at`.
4. El cliente conecta su Stripe desde **Configuración → Cobros**.
5. Cargar catálogo (o capacitarlo para que lo haga).

El código no se toca para dar de alta un cliente. Ese es el punto.

---

## Estructura

```
src/
  app/
    (storefront)/      Tienda pública: portada, catálogo, producto, gracias
    admin/
      login/           Fuera del layout protegido
      (panel)/         Dashboard, productos, inventario, pedidos, reportes
    api/
      checkout/        Crea el pedido y la sesión de Stripe
      stripe/webhook/  Única fuente de verdad sobre el pago
      stripe/connect/  OAuth de Connect
      cron/            Resumen diario de stock bajo
  components/          storefront/ · admin/
  lib/                 tenant · auth · stripe · queries · money · types
supabase/migrations/   Esquema, RLS, funciones, seed
```
