-- ============================================================================
-- Endurecimiento de las políticas públicas.
--
-- El problema que corrige:
-- Las políticas de RLS son PERMISIVAS y se combinan con OR. Una política
-- pública escrita como `for select using (status = 'active')` aplica a
-- cualquiera — incluido un usuario autenticado de OTRA tienda. En una
-- plataforma de un solo tenant eso daría igual; aquí significaba que un
-- cliente de Candela podía leer de la tienda de otro cliente:
--
--   · stores            → stripe_account_id, alert_emails, platform_fee_bps
--   · products          → cost_cents, es decir su margen
--   · product_variants  → niveles de stock
--
-- La corrección tiene dos capas:
--   1. Las políticas públicas se limitan al rol `anon` (el visitante del
--      storefront). Un `authenticated` solo ve su propia tienda.
--   2. GRANT por columna sobre `anon`: aunque la fila sea pública, las
--      columnas de negocio no se entregan. RLS filtra filas; los GRANT
--      filtran columnas. Hacen falta las dos.
-- ============================================================================

-- ─── stores ─────────────────────────────────────────────────────────────────
drop policy if exists stores_public_read on public.stores;
create policy stores_public_read on public.stores
  for select to anon
  using (status = 'active');

revoke select on public.stores from anon;
grant select (
  id, slug, name, tagline, description, logo_url, favicon_url,
  currency, locale, status, theme, support_email, support_phone,
  whatsapp_number, social, created_at
) on public.stores to anon;
-- Fuera del alcance público: stripe_account_id, stripe_charges_enabled,
-- stripe_payouts_enabled, stripe_onboarded_at, platform_fee_bps,
-- alert_emails, low_stock_threshold.

-- ─── products ───────────────────────────────────────────────────────────────
drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select to anon
  using (status = 'active' and public.store_is_live(store_id));

revoke select on public.products from anon;
grant select (
  id, store_id, category_id, slug, name, brand, short_description, description,
  status, is_featured, price_cents, compare_at_cents, track_inventory,
  requires_shipping, weight_grams, attributes, seo_title, seo_description,
  created_at, updated_at
) on public.products to anon;
-- Fuera del alcance público: cost_cents (el margen del comerciante) y
-- low_stock_threshold (cuánto inventario maneja).

-- ─── product_variants ───────────────────────────────────────────────────────
drop policy if exists product_variants_public_read on public.product_variants;
create policy product_variants_public_read on public.product_variants
  for select to anon
  using (is_active and exists (
    select 1 from public.products p
    where p.id = product_id and p.status = 'active' and public.store_is_live(p.store_id)
  ));

-- `stock` sí se expone: la tienda necesita mostrar "quedan 3". Lo que no se
-- expone es el umbral, que revelaría cómo opera el negocio por dentro.
revoke select on public.product_variants from anon;
grant select (
  id, store_id, product_id, sku, name, option_name, option_value,
  price_cents, compare_at_cents, stock, is_default, is_active, position
) on public.product_variants to anon;

-- ─── Resto de tablas públicas: limitar al visitante anónimo ────────────────
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories
  for select to anon
  using (is_visible and public.store_is_live(store_id));

drop policy if exists product_images_public_read on public.product_images;
create policy product_images_public_read on public.product_images
  for select to anon
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.status = 'active' and public.store_is_live(p.store_id)
  ));

drop policy if exists shipping_rates_public_read on public.shipping_rates;
create policy shipping_rates_public_read on public.shipping_rates
  for select to anon
  using (is_active and public.store_is_live(store_id));

drop policy if exists store_domains_public_read on public.store_domains;
create policy store_domains_public_read on public.store_domains
  for select to anon
  using (public.store_is_live(store_id));

-- ─── Miembros: lectura de su propia tienda, ya sin la vía pública ──────────
-- Al restringir las políticas públicas a `anon`, un miembro necesita su
-- propia política de SELECT sobre stores (las demás tablas ya la tenían).
drop policy if exists stores_member_read on public.stores;
create policy stores_member_read on public.stores
  for select to authenticated
  using (public.is_store_member(id));
