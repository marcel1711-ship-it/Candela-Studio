-- ============================================================================
-- Inventario, numeración de pedidos y alertas.
--
-- Todo el movimiento de stock pasa por estas funciones. El cliente nunca
-- escribe `stock` directamente: así la bitácora siempre cuadra con la realidad.
-- ============================================================================

-- ─── Numeración de pedidos, por tienda ──────────────────────────────────────
-- CS-250110-0042 : legible por teléfono, ordenable, sin filtrar volumen total.
create or replace function public.next_order_number(p_store_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_prefix text;
  v_seq    integer;
begin
  select upper(left(regexp_replace(s.slug, '[^a-zA-Z]', '', 'g'), 2))
    into v_prefix
  from public.stores s where s.id = p_store_id;

  v_prefix := coalesce(nullif(v_prefix, ''), 'CS');

  -- UPSERT con RETURNING: atómico incluso con pedidos concurrentes.
  insert into public.store_counters (store_id, day, seq)
  values (p_store_id, current_date, 1)
  on conflict (store_id, day)
    do update set seq = public.store_counters.seq + 1
  returning seq into v_seq;

  return v_prefix || '-' || to_char(now(), 'YYMMDD') || '-' || lpad(v_seq::text, 4, '0');
end;
$$;

-- ─── Umbral efectivo: variante → producto → tienda ──────────────────────────
create or replace function public.effective_low_stock_threshold(p_variant_id uuid)
returns integer
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(v.low_stock_threshold, p.low_stock_threshold, s.low_stock_threshold, 5)
  from public.product_variants v
  join public.products p on p.id = v.product_id
  join public.stores   s on s.id = v.store_id
  where v.id = p_variant_id;
$$;

-- ─── Alerta automática de stock bajo ────────────────────────────────────────
-- Se dispara sola con cada cambio de stock. El cliente configura el umbral
-- y el sistema lo vigila: no depende de que nadie revise un reporte.
create or replace function public.sync_stock_alert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_threshold integer;
  v_tracked   boolean;
begin
  if new.stock is not distinct from old.stock then
    return new;
  end if;

  select p.track_inventory into v_tracked
  from public.products p where p.id = new.product_id;

  if not coalesce(v_tracked, true) then
    return new;
  end if;

  v_threshold := public.effective_low_stock_threshold(new.id);

  if new.stock <= v_threshold then
    -- El índice parcial stock_alerts_one_open garantiza una sola alerta viva
    -- por variante: el cliente recibe un aviso, no cuarenta.
    insert into public.stock_alerts (store_id, variant_id, threshold, stock_at_alert)
    values (new.store_id, new.id, v_threshold, new.stock)
    on conflict (variant_id) where status in ('open','notified') do nothing;
  else
    -- Se repuso: cerramos la alerta para que pueda volver a dispararse luego.
    update public.stock_alerts
       set status = 'resolved', resolved_at = now()
     where variant_id = new.id and status in ('open','notified');
  end if;

  return new;
end;
$$;

drop trigger if exists product_variants_stock_alert on public.product_variants;
create trigger product_variants_stock_alert
  after update of stock on public.product_variants
  for each row execute function public.sync_stock_alert();

-- ─── Ajuste manual de stock (admin) ─────────────────────────────────────────
create or replace function public.adjust_variant_stock(
  p_variant_id uuid,
  p_delta      integer,
  p_reason     text default 'adjustment',
  p_note       text default null
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_store_id uuid;
  v_stock    integer;
begin
  select store_id into v_store_id from public.product_variants where id = p_variant_id;
  if v_store_id is null then
    raise exception 'La variante % no existe', p_variant_id using errcode = 'P0002';
  end if;

  -- La función es security definer, así que revalidamos el permiso a mano.
  if not public.is_store_member(v_store_id) then
    raise exception 'Sin permiso sobre esta tienda' using errcode = '42501';
  end if;

  update public.product_variants
     set stock = greatest(stock + p_delta, 0)
   where id = p_variant_id
   returning stock into v_stock;

  insert into public.inventory_movements
    (store_id, variant_id, delta, stock_after, reason, note, created_by)
  values
    (v_store_id, p_variant_id, p_delta, v_stock, p_reason, p_note, auth.uid());

  return v_stock;
end;
$$;

-- ─── Descuento de inventario al confirmarse el pago ─────────────────────────
-- Se llama SOLO desde el webhook de Stripe, ya verificado.
--
-- Dos garantías que importan:
--   1. Idempotencia: la bandera inventory_applied se revisa bajo lock, así que
--      por más veces que Stripe reintente el webhook, el stock baja una vez.
--   2. Serialización: el FOR UPDATE por variante en orden estable evita que
--      dos compras simultáneas lean el mismo stock y vendan de más.
create or replace function public.apply_order_inventory(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order   public.orders%rowtype;
  v_item    record;
  v_stock   integer;
  v_tracked boolean;
begin
  select * into v_order from public.orders where id = p_order_id for update;

  if not found then
    raise exception 'Pedido % no existe', p_order_id using errcode = 'P0002';
  end if;

  if v_order.inventory_applied then
    return;  -- ya se aplicó: reintento de webhook, no hacemos nada
  end if;

  for v_item in
    select oi.variant_id, oi.quantity, oi.product_name
    from public.order_items oi
    where oi.order_id = p_order_id and oi.variant_id is not null
    order by oi.variant_id   -- orden estable entre transacciones => sin deadlocks
  loop
    select p.track_inventory into v_tracked
    from public.product_variants v
    join public.products p on p.id = v.product_id
    where v.id = v_item.variant_id;

    continue when not coalesce(v_tracked, true);

    update public.product_variants
       set stock = stock - v_item.quantity
     where id = v_item.variant_id
     returning stock into v_stock;

    insert into public.inventory_movements
      (store_id, variant_id, delta, stock_after, reason, order_id, note)
    values
      (v_order.store_id, v_item.variant_id, -v_item.quantity, v_stock, 'sale', p_order_id,
       case when v_stock < 0
            then 'Sobreventa detectada: ' || abs(v_stock) || ' unidad(es) por debajo de cero'
            else null end);
  end loop;

  update public.orders
     set inventory_applied = true
   where id = p_order_id;
end;
$$;

-- ─── Devolver inventario (cancelación o reembolso) ──────────────────────────
create or replace function public.restore_order_inventory(
  p_order_id uuid,
  p_reason   text default 'cancellation'
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
  v_item  record;
  v_stock integer;
begin
  select * into v_order from public.orders where id = p_order_id for update;

  if not found then
    raise exception 'Pedido % no existe', p_order_id using errcode = 'P0002';
  end if;

  if not v_order.inventory_applied then
    return;  -- nunca se descontó: nada que devolver
  end if;

  for v_item in
    select oi.variant_id, oi.quantity
    from public.order_items oi
    where oi.order_id = p_order_id and oi.variant_id is not null
    order by oi.variant_id
  loop
    update public.product_variants
       set stock = stock + v_item.quantity
     where id = v_item.variant_id
     returning stock into v_stock;

    insert into public.inventory_movements
      (store_id, variant_id, delta, stock_after, reason, order_id, created_by)
    values
      (v_order.store_id, v_item.variant_id, v_item.quantity, v_stock, p_reason, p_order_id, auth.uid());
  end loop;

  update public.orders
     set inventory_applied = false
   where id = p_order_id;
end;
$$;

-- ─── Disponibilidad en tiempo real (validación previa al checkout) ──────────
-- Evita cobrar por algo que ya no existe: se llama antes de crear la sesión
-- de Stripe, no después.
create or replace function public.check_availability(p_items jsonb)
returns table (variant_id uuid, requested integer, available integer, ok boolean)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    v.id,
    (i->>'quantity')::integer,
    v.stock,
    (not p.track_inventory) or v.stock >= (i->>'quantity')::integer
  from jsonb_array_elements(p_items) i
  join public.product_variants v on v.id = (i->>'variant_id')::uuid
  join public.products p on p.id = v.product_id
  where v.is_active and p.status = 'active';
$$;

-- ─── Métricas del dashboard ─────────────────────────────────────────────────
create or replace function public.store_dashboard(p_store_id uuid, p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_since timestamptz := now() - make_interval(days => p_days);
  v_prev  timestamptz := now() - make_interval(days => p_days * 2);
  v_out   jsonb;
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'Sin permiso sobre esta tienda' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'revenue_cents',      coalesce(sum(total_cents) filter (where paid_at >= v_since), 0),
    'revenue_prev_cents', coalesce(sum(total_cents) filter (where paid_at >= v_prev and paid_at < v_since), 0),
    'orders',             count(*) filter (where paid_at >= v_since),
    'orders_prev',        count(*) filter (where paid_at >= v_prev and paid_at < v_since),
    'aov_cents',          coalesce(round(avg(total_cents) filter (where paid_at >= v_since)), 0),
    'pending',            count(*) filter (where status = 'paid' and fulfillment_status = 'unfulfilled')
  )
  into v_out
  from public.orders
  where store_id = p_store_id
    and status in ('paid','fulfilled');

  return v_out
    || jsonb_build_object(
         'low_stock', (
           select count(*) from public.stock_alerts
           where store_id = p_store_id and status in ('open','notified')
         ),
         'products', (
           select count(*) from public.products
           where store_id = p_store_id and status = 'active'
         ),
         'customers', (
           select count(*) from public.customers where store_id = p_store_id
         )
       );
end;
$$;

-- Ventas por día, para la gráfica del dashboard.
create or replace function public.store_sales_series(p_store_id uuid, p_days integer default 30)
returns table (day date, revenue_cents bigint, orders bigint)
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
  select d.day::date,
         coalesce(sum(o.total_cents), 0)::bigint,
         count(o.id)::bigint
  from generate_series(
         date_trunc('day', now() - make_interval(days => p_days - 1)),
         date_trunc('day', now()),
         '1 day'
       ) as d(day)
  left join public.orders o
    on o.store_id = p_store_id
   and o.status in ('paid','fulfilled')
   and date_trunc('day', o.paid_at) = d.day
  group by d.day
  order by d.day;
end;
$$;

-- ─── Canje de cupones ───────────────────────────────────────────────────────
-- Incremento atómico: dos compras simultáneas con el mismo cupón no pueden
-- saltarse el límite de canjes leyendo ambas el mismo valor.
create or replace function public.increment_coupon_redemption(
  p_store_id uuid,
  p_code     text
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_times integer;
begin
  update public.coupons
     set times_redeemed = times_redeemed + 1
   where store_id = p_store_id
     and upper(code) = upper(p_code)
   returning times_redeemed into v_times;

  return coalesce(v_times, 0);
end;
$$;
