-- ============================================================================
-- Multicanal por CSV.
--
-- El dolor real de quien vende en varios lados no es publicar desde un solo
-- lugar: es que vendió el mismo producto en Amazon y en su web teniendo uno.
-- Esto resuelve eso sin tocar ninguna API: el inventario de la plataforma
-- pasa a ser la fuente de verdad y los demás canales se concilian con
-- archivos que los propios marketplaces ya exportan.
-- ============================================================================

-- ─── Canales de venta ───────────────────────────────────────────────────────
create table if not exists public.sales_channels (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  type        text not null
                check (type in ('web','amazon','walmart','tiktok','etsy','ebay','mercadolibre','otro')),
  name        text not null,
  is_active   boolean not null default true,
  -- Stock que NO se ofrece en este canal, como colchón contra la sobreventa
  -- entre canales: el inventario de un marketplace nunca está al día al
  -- segundo, así que se le muestra menos de lo que hay.
  stock_buffer integer not null default 0 check (stock_buffer >= 0),
  -- Mapeo de columnas aprendido en la primera importación, para no volver a
  -- pedirlo cada mes.
  csv_mapping jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (store_id, type)
);
create trigger sales_channels_touch before update on public.sales_channels
  for each row execute function public.touch_updated_at();

comment on column public.sales_channels.stock_buffer is
  'Unidades reservadas que no se publican en este canal. Evita vender la última pieza dos veces.';

-- ─── SKU por canal ──────────────────────────────────────────────────────────
-- Cada marketplace suele tener su propio SKU para el mismo producto. Sin este
-- mapeo, la conciliación falla justo en los productos que más se mueven.
create table if not exists public.channel_listings (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null references public.stores(id) on delete cascade,
  channel_id     uuid not null references public.sales_channels(id) on delete cascade,
  variant_id     uuid not null references public.product_variants(id) on delete cascade,
  external_sku   text not null,
  -- ASIN, item id… lo deja listo para el día que se integre por API.
  external_id    text,
  is_active      boolean not null default true,
  last_synced_at timestamptz,
  created_at     timestamptz not null default now()
);
create unique index if not exists channel_listings_sku_key
  on public.channel_listings (channel_id, lower(external_sku));
create index if not exists channel_listings_variant_idx
  on public.channel_listings (variant_id);

-- ─── Lotes de importación ───────────────────────────────────────────────────
-- Toda importación queda registrada. Sin esto, un CSV equivocado sería
-- imposible de revertir y el inventario quedaría mal para siempre.
create table if not exists public.import_batches (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null references public.stores(id) on delete cascade,
  channel_id     uuid references public.sales_channels(id) on delete set null,
  kind           text not null check (kind in ('sales','inventory','products')),
  filename       text,
  rows_total     integer not null default 0,
  rows_imported  integer not null default 0,
  rows_skipped   integer not null default 0,
  rows_failed    integer not null default 0,
  -- Filas que no casaron, con su motivo: es lo que el cliente necesita ver
  -- para corregir sus SKU.
  issues         jsonb not null default '[]'::jsonb,
  status         text not null default 'completed'
                   check (status in ('completed','reverted','failed')),
  created_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  reverted_at    timestamptz
);
create index if not exists import_batches_store_idx
  on public.import_batches (store_id, created_at desc);

-- ─── Pedidos: de qué canal vienen ───────────────────────────────────────────
alter table public.orders
  add column if not exists channel_id       uuid references public.sales_channels(id) on delete set null,
  add column if not exists external_order_id text,
  add column if not exists import_batch_id  uuid references public.import_batches(id) on delete set null;

-- La garantía de idempotencia de las importaciones: reimportar el reporte del
-- mes no duplica pedidos ni vuelve a descontar inventario.
create unique index if not exists orders_channel_external_key
  on public.orders (store_id, channel_id, external_order_id)
  where external_order_id is not null;

create index if not exists orders_channel_idx on public.orders (store_id, channel_id);
create index if not exists orders_batch_idx on public.orders (import_batch_id);

-- ─── RLS ────────────────────────────────────────────────────────────────────
alter table public.sales_channels   enable row level security;
alter table public.channel_listings enable row level security;
alter table public.import_batches   enable row level security;

create policy sales_channels_member_all on public.sales_channels
  for all to authenticated
  using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

create policy channel_listings_member_all on public.channel_listings
  for all to authenticated
  using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

create policy import_batches_member_all on public.import_batches
  for all to authenticated
  using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

-- El canal web sí es público: el storefront necesita saber cuál es el suyo.
create policy sales_channels_public_read on public.sales_channels
  for select to anon
  using (type = 'web' and public.store_is_live(store_id));

-- ─── Toda tienda existente estrena su canal web ────────────────────────────
insert into public.sales_channels (store_id, type, name)
select id, 'web', 'Tienda en línea' from public.stores
on conflict (store_id, type) do nothing;

-- Y toda tienda nueva también, automáticamente.
create or replace function public.create_default_channel()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.sales_channels (store_id, type, name)
  values (new.id, 'web', 'Tienda en línea')
  on conflict (store_id, type) do nothing;
  return new;
end;
$$;

drop trigger if exists stores_default_channel on public.stores;
create trigger stores_default_channel
  after insert on public.stores
  for each row execute function public.create_default_channel();

-- ─── Revertir una importación ───────────────────────────────────────────────
-- Devuelve el inventario y cancela los pedidos que creó ese lote.
create or replace function public.revert_import_batch(p_batch_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_batch public.import_batches%rowtype;
  v_order record;
  v_count integer := 0;
begin
  select * into v_batch from public.import_batches where id = p_batch_id for update;

  if not found then
    raise exception 'Lote % no existe', p_batch_id using errcode = 'P0002';
  end if;
  if not public.is_store_member(v_batch.store_id) then
    raise exception 'Sin permiso sobre esta tienda' using errcode = '42501';
  end if;
  if v_batch.status = 'reverted' then
    return 0;  -- ya se revirtió
  end if;

  for v_order in
    select id from public.orders where import_batch_id = p_batch_id
  loop
    perform public.restore_order_inventory(v_order.id, 'cancellation');
    update public.orders
       set status = 'cancelled', cancelled_at = now()
     where id = v_order.id;
    v_count := v_count + 1;
  end loop;

  update public.import_batches
     set status = 'reverted', reverted_at = now()
   where id = p_batch_id;

  return v_count;
end;
$$;

-- ─── Ventas por canal, para el panel ────────────────────────────────────────
create or replace function public.store_sales_by_channel(
  p_store_id uuid,
  p_days     integer default 30
)
returns table (
  channel_id    uuid,
  channel_type  text,
  channel_name  text,
  revenue_cents bigint,
  orders        bigint,
  units         bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'Sin permiso sobre esta tienda' using errcode = '42501';
  end if;

  return query
  select
    c.id, c.type, c.name,
    coalesce(sum(o.total_cents), 0)::bigint,
    count(distinct o.id)::bigint,
    coalesce(sum(oi.quantity), 0)::bigint
  from public.sales_channels c
  left join public.orders o
    on o.channel_id = c.id
   and o.status in ('paid','fulfilled')
   and o.paid_at >= now() - make_interval(days => p_days)
  left join public.order_items oi on oi.order_id = o.id
  where c.store_id = p_store_id and c.is_active
  group by c.id, c.type, c.name
  order by 4 desc;
end;
$$;
