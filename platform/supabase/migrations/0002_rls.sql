-- ============================================================================
-- Row Level Security — el aislamiento real entre tiendas.
--
-- Principio: si mañana un bug en el código olvida un .eq('store_id', ...),
-- la base de datos igual se niega a devolver filas ajenas.
-- Nada en el storefront escribe directo: los pedidos se crean server-side.
-- ============================================================================

-- ─── Helpers (security definer para evitar recursión en las políticas) ──────
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select p.is_platform_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.is_store_member(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_platform_admin() or exists (
    select 1 from public.store_members m
    where m.store_id = p_store_id and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_store_owner(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_platform_admin() or exists (
    select 1 from public.store_members m
    where m.store_id = p_store_id
      and m.user_id = auth.uid()
      and m.role = 'owner'
  );
$$;

-- ¿La tienda está publicada? Usado por las políticas públicas del storefront.
create or replace function public.store_is_live(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.stores s
    where s.id = p_store_id and s.status = 'active'
  );
$$;

-- ─── Activar RLS en absolutamente todo ──────────────────────────────────────
alter table public.stores              enable row level security;
alter table public.store_domains       enable row level security;
alter table public.profiles            enable row level security;
alter table public.store_members       enable row level security;
alter table public.categories          enable row level security;
alter table public.products            enable row level security;
alter table public.product_images      enable row level security;
alter table public.product_variants    enable row level security;
alter table public.customers           enable row level security;
alter table public.orders              enable row level security;
alter table public.order_items         enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.stock_alerts        enable row level security;
alter table public.coupons             enable row level security;
alter table public.shipping_rates      enable row level security;
alter table public.audit_log           enable row level security;

-- ─── stores ─────────────────────────────────────────────────────────────────
create policy stores_public_read on public.stores
  for select using (status = 'active');

create policy stores_member_read on public.stores
  for select to authenticated using (public.is_store_member(id));

create policy stores_owner_update on public.stores
  for update to authenticated
  using (public.is_store_owner(id))
  with check (public.is_store_owner(id));

-- Solo Candela crea o elimina tiendas. No hay registro público: es intencional.
create policy stores_platform_insert on public.stores
  for insert to authenticated with check (public.is_platform_admin());
create policy stores_platform_delete on public.stores
  for delete to authenticated using (public.is_platform_admin());

-- ─── store_domains ──────────────────────────────────────────────────────────
create policy store_domains_public_read on public.store_domains
  for select using (public.store_is_live(store_id));
create policy store_domains_platform_all on public.store_domains
  for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ─── profiles ───────────────────────────────────────────────────────────────
create policy profiles_self_read on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_platform_admin());
create policy profiles_self_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Nadie se auto-promueve a admin de plataforma. Un trigger es más robusto que
-- una política con subconsulta: cubre cualquier ruta de escritura.
create or replace function public.prevent_admin_escalation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.is_platform_admin is distinct from old.is_platform_admin
     and not public.is_platform_admin() then
    raise exception 'No puedes modificar el nivel de administrador de plataforma'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_no_escalation on public.profiles;
create trigger profiles_no_escalation
  before update on public.profiles
  for each row execute function public.prevent_admin_escalation();

-- ─── store_members ──────────────────────────────────────────────────────────
create policy store_members_read on public.store_members
  for select to authenticated
  using (user_id = auth.uid() or public.is_store_member(store_id));
create policy store_members_owner_manage on public.store_members
  for all to authenticated
  using (public.is_store_owner(store_id))
  with check (public.is_store_owner(store_id));

-- ─── Catálogo: lectura pública, escritura solo de miembros ──────────────────
create policy categories_public_read on public.categories
  for select using (is_visible and public.store_is_live(store_id));
create policy categories_member_all on public.categories
  for all to authenticated
  using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

create policy products_public_read on public.products
  for select using (status = 'active' and public.store_is_live(store_id));
create policy products_member_all on public.products
  for all to authenticated
  using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

create policy product_images_public_read on public.product_images
  for select using (exists (
    select 1 from public.products p
    where p.id = product_id and p.status = 'active' and public.store_is_live(p.store_id)
  ));
create policy product_images_member_all on public.product_images
  for all to authenticated
  using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

create policy product_variants_public_read on public.product_variants
  for select using (is_active and exists (
    select 1 from public.products p
    where p.id = product_id and p.status = 'active' and public.store_is_live(p.store_id)
  ));
create policy product_variants_member_all on public.product_variants
  for all to authenticated
  using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

-- Tarifas de envío: públicas (el comprador necesita verlas antes de pagar).
create policy shipping_rates_public_read on public.shipping_rates
  for select using (is_active and public.store_is_live(store_id));
create policy shipping_rates_member_all on public.shipping_rates
  for all to authenticated
  using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

-- ─── Datos sensibles: SIN lectura pública, en ninguna circunstancia ─────────
-- Los cupones no se listan públicamente: filtrar la tabla sería regalar los
-- códigos de descuento. La validación ocurre server-side.
create policy coupons_member_all on public.coupons
  for all to authenticated
  using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

create policy customers_member_all on public.customers
  for all to authenticated
  using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

create policy orders_member_all on public.orders
  for all to authenticated
  using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

create policy order_items_member_all on public.order_items
  for all to authenticated
  using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

create policy inventory_movements_member_read on public.inventory_movements
  for select to authenticated using (public.is_store_member(store_id));

create policy stock_alerts_member_all on public.stock_alerts
  for all to authenticated
  using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

-- La bitácora se lee, nunca se edita ni se borra desde la aplicación.
create policy audit_log_member_read on public.audit_log
  for select to authenticated using (public.is_store_member(store_id));


-- La bitácora se escribe desde el panel con la sesión del usuario. Sin esta
-- política, logAudit() fallaba en silencio y la auditoría quedaba vacía.
create policy audit_log_member_insert on public.audit_log
  for insert to authenticated with check (public.is_store_member(store_id));

-- store_counters solo lo toca next_order_number(), que es security definer.
alter table public.store_counters enable row level security;

create policy store_counters_member on public.store_counters
  for all to authenticated
  using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));
