-- ============================================================================
-- Validación interna en las funciones de inventario.
--
-- El problema que corrige:
-- En Supabase, TODA función de `public` queda publicada como endpoint REST en
-- /rest/v1/rpc/<nombre>. Siendo SECURITY DEFINER corren con los privilegios
-- del dueño y saltan RLS. Dos de ellas no validaban permisos por dentro:
--
--   apply_order_inventory(order_id)    → cualquiera podía descontar stock
--   restore_order_inventory(order_id)  → cualquiera podía inflarlo
--
-- Bastaba con adivinar un uuid de pedido.
--
-- Se deja pasar cuando auth.uid() es NULL porque ese es el webhook de Stripe
-- corriendo con service_role, ya verificado por firma. El acceso anónimo se
-- cierra aparte, con los GRANT de 0008.
-- ============================================================================

create or replace function public.touch_updated_at()
returns trigger language plpgsql
set search_path = public, pg_temp as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.apply_order_inventory(p_order_id uuid)
returns void language plpgsql security definer
set search_path = public, pg_temp as $$
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

  -- Con sesión: debe ser miembro. Sin sesión: es el webhook (service_role).
  if auth.uid() is not null and not public.is_store_member(v_order.store_id) then
    raise exception 'Sin permiso sobre esta tienda' using errcode = '42501';
  end if;

  if v_order.inventory_applied then return; end if;

  for v_item in
    select oi.variant_id, oi.quantity from public.order_items oi
    where oi.order_id = p_order_id and oi.variant_id is not null
    order by oi.variant_id
  loop
    select p.track_inventory into v_tracked
    from public.product_variants v
    join public.products p on p.id = v.product_id
    where v.id = v_item.variant_id;

    continue when not coalesce(v_tracked, true);

    update public.product_variants
       set stock = stock - v_item.quantity
     where id = v_item.variant_id returning stock into v_stock;

    insert into public.inventory_movements
      (store_id, variant_id, delta, stock_after, reason, order_id, note)
    values (v_order.store_id, v_item.variant_id, -v_item.quantity, v_stock, 'sale', p_order_id,
      case when v_stock < 0
           then 'Sobreventa detectada: ' || abs(v_stock) || ' unidad(es) por debajo de cero'
           else null end);
  end loop;

  update public.orders set inventory_applied = true where id = p_order_id;
end;
$$;

create or replace function public.restore_order_inventory(
  p_order_id uuid, p_reason text default 'cancellation'
)
returns void language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_order public.orders%rowtype;
  v_item  record;
  v_stock integer;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Pedido % no existe', p_order_id using errcode = 'P0002';
  end if;

  if auth.uid() is not null and not public.is_store_member(v_order.store_id) then
    raise exception 'Sin permiso sobre esta tienda' using errcode = '42501';
  end if;

  if not v_order.inventory_applied then return; end if;

  for v_item in
    select oi.variant_id, oi.quantity from public.order_items oi
    where oi.order_id = p_order_id and oi.variant_id is not null
    order by oi.variant_id
  loop
    update public.product_variants
       set stock = stock + v_item.quantity
     where id = v_item.variant_id returning stock into v_stock;

    insert into public.inventory_movements
      (store_id, variant_id, delta, stock_after, reason, order_id, created_by)
    values (v_order.store_id, v_item.variant_id, v_item.quantity, v_stock, p_reason, p_order_id, auth.uid());
  end loop;

  update public.orders set inventory_applied = false where id = p_order_id;
end;
$$;
