-- ============================================================================
-- Candela Commerce — Esquema multi-tenant
-- Regla de oro: TODA tabla de negocio lleva store_id. Sin excepciones.
-- El aislamiento real lo da RLS (0002), no el código de la aplicación.
-- ============================================================================

create extension if not exists pgcrypto;

-- ─── Utilidades ─────────────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ─── Tenants ────────────────────────────────────────────────────────────────
create table if not exists public.stores (
  id                      uuid primary key default gen_random_uuid(),
  slug                    text not null unique,
  name                    text not null,
  tagline                 text,
  description             text,
  logo_url                text,
  favicon_url             text,
  currency                char(3) not null default 'USD',
  locale                  text not null default 'es-US',
  status                  text not null default 'draft'
                            check (status in ('draft','active','suspended')),
  -- Tema por tenant: colores, tipografía, hero. El storefront lo lee en runtime.
  theme                   jsonb not null default '{}'::jsonb,
  -- Umbral por defecto de stock bajo; cada producto/variante puede sobrescribirlo.
  low_stock_threshold     integer not null default 5 check (low_stock_threshold >= 0),
  -- Stripe Connect: NUNCA guardamos llaves secretas del cliente, solo el account id.
  stripe_account_id       text unique,
  stripe_charges_enabled  boolean not null default false,
  stripe_payouts_enabled  boolean not null default false,
  stripe_onboarded_at     timestamptz,
  platform_fee_bps        integer not null default 0
                            check (platform_fee_bps between 0 and 2000),
  support_email           text,
  support_phone           text,
  whatsapp_number         text,
  alert_emails            text[] not null default '{}',
  social                  jsonb not null default '{}'::jsonb,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create trigger stores_touch before update on public.stores
  for each row execute function public.touch_updated_at();

comment on column public.stores.stripe_account_id is
  'ID de cuenta conectada de Stripe (acct_...). La llave secreta vive en Stripe, no aquí.';
comment on column public.stores.platform_fee_bps is
  'Comisión de Candela por transacción, en puntos base. 100 bps = 1%.';

-- Dominios personalizados. Un tenant puede tener varios (apex + www + staging).
create table if not exists public.store_domains (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  domain      text not null,
  is_primary  boolean not null default false,
  verified_at timestamptz,
  created_at  timestamptz not null default now()
);
create unique index if not exists store_domains_domain_key
  on public.store_domains (lower(domain));
create index if not exists store_domains_store_idx on public.store_domains (store_id);
create unique index if not exists store_domains_one_primary
  on public.store_domains (store_id) where is_primary;

-- Contador atómico de folios. Un UPDATE ... RETURNING serializa dos pedidos
-- simultáneos, cosa que un count(*) nunca garantizaría.
create table if not exists public.store_counters (
  store_id uuid not null references public.stores(id) on delete cascade,
  day      date not null default current_date,
  seq      integer not null default 0,
  primary key (store_id, day)
);

-- ─── Identidad ──────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text,
  full_name         text,
  avatar_url        text,
  -- Staff de Candela: ve y administra todos los tenants.
  is_platform_admin boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Alta automática de perfil al registrarse en auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, lower(new.email), new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Quién puede administrar qué tienda.
create table if not exists public.store_members (
  store_id   uuid not null references public.stores(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       text not null default 'staff' check (role in ('owner','staff')),
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);
create index if not exists store_members_user_idx on public.store_members (user_id);

comment on table public.store_members is
  'owner = dueño del negocio (ve finanzas y config). staff = empleado (catálogo y pedidos).';

-- ─── Catálogo ───────────────────────────────────────────────────────────────
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  slug        text not null,
  name        text not null,
  description text,
  image_url   text,
  position    integer not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (store_id, slug)
);
create trigger categories_touch before update on public.categories
  for each row execute function public.touch_updated_at();

create table if not exists public.products (
  id                  uuid primary key default gen_random_uuid(),
  store_id            uuid not null references public.stores(id) on delete cascade,
  category_id         uuid references public.categories(id) on delete set null,
  slug                text not null,
  name                text not null,
  brand               text,
  short_description   text,
  description         text,
  status              text not null default 'draft'
                        check (status in ('draft','active','archived')),
  is_featured         boolean not null default false,
  -- Precio base en centavos. Entero siempre: nunca float para dinero.
  price_cents         integer not null check (price_cents >= 0),
  compare_at_cents    integer check (compare_at_cents >= 0),
  cost_cents          integer check (cost_cents >= 0),
  track_inventory     boolean not null default true,
  low_stock_threshold integer check (low_stock_threshold >= 0),
  requires_shipping   boolean not null default true,
  weight_grams        integer check (weight_grams >= 0),
  -- Atributos libres por vertical (notas olfativas, concentración, género...).
  attributes          jsonb not null default '{}'::jsonb,
  seo_title           text,
  seo_description     text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (store_id, slug)
);
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
create index if not exists products_store_status_idx
  on public.products (store_id, status);
create index if not exists products_featured_idx
  on public.products (store_id, is_featured) where status = 'active';
create index if not exists products_category_idx on public.products (category_id);

comment on column public.products.low_stock_threshold is
  'NULL = hereda stores.low_stock_threshold. Permite afinar por producto.';

create table if not exists public.product_images (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  url        text not null,
  alt        text,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists product_images_product_idx
  on public.product_images (product_id, position);

-- El inventario vive SOLO aquí. Todo producto tiene al menos una variante
-- (la "default"), así nunca hay dos fuentes de verdad para el stock.
create table if not exists public.product_variants (
  id                  uuid primary key default gen_random_uuid(),
  store_id            uuid not null references public.stores(id) on delete cascade,
  product_id          uuid not null references public.products(id) on delete cascade,
  sku                 text,
  name                text not null default 'Única',
  option_name         text,
  option_value        text,
  price_cents         integer check (price_cents >= 0),
  compare_at_cents    integer check (compare_at_cents >= 0),
  stock               integer not null default 0,
  low_stock_threshold integer check (low_stock_threshold >= 0),
  is_default          boolean not null default false,
  is_active           boolean not null default true,
  position            integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger product_variants_touch before update on public.product_variants
  for each row execute function public.touch_updated_at();
create unique index if not exists product_variants_sku_key
  on public.product_variants (store_id, lower(sku)) where sku is not null;
create index if not exists product_variants_product_idx
  on public.product_variants (product_id, position);

comment on column public.product_variants.price_cents is
  'NULL = usa products.price_cents. Solo se llena si la variante cuesta distinto.';

-- ─── Clientes y pedidos ─────────────────────────────────────────────────────
create table if not exists public.customers (
  id                 uuid primary key default gen_random_uuid(),
  store_id           uuid not null references public.stores(id) on delete cascade,
  email              text not null,
  full_name          text,
  phone              text,
  stripe_customer_id text,
  marketing_opt_in   boolean not null default false,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger customers_touch before update on public.customers
  for each row execute function public.touch_updated_at();
create unique index if not exists customers_store_email_key
  on public.customers (store_id, lower(email));

create table if not exists public.orders (
  id                          uuid primary key default gen_random_uuid(),
  store_id                    uuid not null references public.stores(id) on delete cascade,
  order_number                text not null,
  customer_id                 uuid references public.customers(id) on delete set null,
  email                       text not null,
  phone                       text,
  status                      text not null default 'pending'
                                check (status in ('pending','paid','fulfilled','cancelled','refunded')),
  fulfillment_status          text not null default 'unfulfilled'
                                check (fulfillment_status in ('unfulfilled','partial','fulfilled')),
  currency                    char(3) not null default 'USD',
  subtotal_cents              integer not null default 0,
  discount_cents              integer not null default 0,
  shipping_cents              integer not null default 0,
  tax_cents                   integer not null default 0,
  total_cents                 integer not null default 0,
  coupon_code                 text,
  shipping_address            jsonb,
  billing_address             jsonb,
  stripe_checkout_session_id  text unique,
  stripe_payment_intent_id    text,
  -- Idempotencia: garantiza que el webhook descuente inventario UNA sola vez,
  -- por más veces que Stripe reintente la entrega.
  inventory_applied           boolean not null default false,
  carrier                     text,
  tracking_number             text,
  tracking_url                text,
  customer_note               text,
  internal_note               text,
  placed_at                   timestamptz not null default now(),
  paid_at                     timestamptz,
  fulfilled_at                timestamptz,
  cancelled_at                timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  unique (store_id, order_number)
);
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();
create index if not exists orders_store_status_idx on public.orders (store_id, status);
create index if not exists orders_store_placed_idx on public.orders (store_id, placed_at desc);
create index if not exists orders_customer_idx on public.orders (customer_id);

-- Snapshot del producto al momento de la compra: si mañana cambia el precio
-- o se borra el producto, el pedido histórico sigue siendo legible.
create table if not exists public.order_items (
  id               uuid primary key default gen_random_uuid(),
  store_id         uuid not null references public.stores(id) on delete cascade,
  order_id         uuid not null references public.orders(id) on delete cascade,
  product_id       uuid references public.products(id) on delete set null,
  variant_id       uuid references public.product_variants(id) on delete set null,
  product_name     text not null,
  variant_name     text,
  sku              text,
  image_url        text,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity         integer not null check (quantity > 0),
  total_cents      integer not null check (total_cents >= 0),
  created_at       timestamptz not null default now()
);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_variant_idx on public.order_items (variant_id);

-- ─── Inventario: bitácora y alertas ─────────────────────────────────────────
create table if not exists public.inventory_movements (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  variant_id  uuid not null references public.product_variants(id) on delete cascade,
  delta       integer not null,
  stock_after integer not null,
  reason      text not null
                check (reason in ('sale','restock','adjustment','return','cancellation','initial')),
  order_id    uuid references public.orders(id) on delete set null,
  note        text,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists inventory_movements_variant_idx
  on public.inventory_movements (variant_id, created_at desc);
create index if not exists inventory_movements_store_idx
  on public.inventory_movements (store_id, created_at desc);

create table if not exists public.stock_alerts (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null references public.stores(id) on delete cascade,
  variant_id     uuid not null references public.product_variants(id) on delete cascade,
  threshold      integer not null,
  stock_at_alert integer not null,
  status         text not null default 'open'
                   check (status in ('open','notified','resolved')),
  notified_at    timestamptz,
  resolved_at    timestamptz,
  created_at     timestamptz not null default now()
);
-- Una sola alerta viva por variante: evita 40 correos por el mismo producto.
create unique index if not exists stock_alerts_one_open
  on public.stock_alerts (variant_id) where status in ('open','notified');
create index if not exists stock_alerts_store_idx
  on public.stock_alerts (store_id, status, created_at desc);

-- ─── Promociones y envíos ───────────────────────────────────────────────────
create table if not exists public.coupons (
  id                uuid primary key default gen_random_uuid(),
  store_id          uuid not null references public.stores(id) on delete cascade,
  code              text not null,
  type              text not null check (type in ('percent','fixed')),
  value             integer not null check (value > 0),
  min_subtotal_cents integer not null default 0,
  starts_at         timestamptz,
  ends_at           timestamptz,
  max_redemptions   integer,
  times_redeemed    integer not null default 0,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger coupons_touch before update on public.coupons
  for each row execute function public.touch_updated_at();
create unique index if not exists coupons_store_code_key
  on public.coupons (store_id, upper(code));

comment on column public.coupons.value is
  'percent => 1-100. fixed => centavos de descuento.';

create table if not exists public.shipping_rates (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null references public.stores(id) on delete cascade,
  name           text not null,
  description    text,
  countries      text[] not null default '{US}',
  states         text[],
  price_cents    integer not null default 0 check (price_cents >= 0),
  free_over_cents integer check (free_over_cents >= 0),
  min_days       integer,
  max_days       integer,
  -- Fragancias con alcohol = mercancía limitada (ORM-D): solo terrestre.
  ground_only    boolean not null default false,
  is_active      boolean not null default true,
  position       integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger shipping_rates_touch before update on public.shipping_rates
  for each row execute function public.touch_updated_at();
create index if not exists shipping_rates_store_idx on public.shipping_rates (store_id, is_active);

-- ─── Auditoría ──────────────────────────────────────────────────────────────
create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  actor_id    uuid references public.profiles(id) on delete set null,
  actor_email text,
  action      text not null,
  entity      text not null,
  entity_id   uuid,
  diff        jsonb,
  ip          text,
  created_at  timestamptz not null default now()
);
create index if not exists audit_log_store_idx on public.audit_log (store_id, created_at desc);

comment on table public.audit_log is
  'Quién cambió qué precio y cuándo. Resuelve el 90% de los "a mí no me funciona".';
