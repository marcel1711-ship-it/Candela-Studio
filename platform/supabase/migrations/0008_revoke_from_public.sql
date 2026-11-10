-- ============================================================================
-- Cierre real del acceso a las funciones RPC.
--
-- Por qué hace falta aparte de 0007:
-- En Postgres el pseudo-rol PUBLIC tiene EXECUTE por defecto sobre toda
-- función nueva. `REVOKE ... FROM anon` NO quita ese permiso heredado — anon
-- sigue pudiendo llamarlas. Se verificó en la base real: antes de esto,
-- increment_coupon_redemption se ejecutaba como anónimo.
--
-- La forma correcta siempre es: REVOKE FROM PUBLIC y luego GRANT explícito a
-- cada rol que de verdad la necesita. Lista blanca, no lista negra.
--
-- Nota sobre triggers: Postgres valida el privilegio al CREAR el trigger, no
-- al dispararlo, así que quitarle EXECUTE a todos no los rompe.
-- ============================================================================

-- ─── Funciones de trigger: nadie las llama a mano ──────────────────────────
revoke all on function public.touch_updated_at()         from public;
revoke all on function public.handle_new_user()          from public;
revoke all on function public.sync_stock_alert()         from public;
revoke all on function public.prevent_admin_escalation() from public;
revoke all on function public.create_default_channel()   from public;

-- ─── Helpers de RLS: anon y authenticated DEBEN poder ejecutarlos ──────────
-- Una política se evalúa con los privilegios de quien consulta. Sin esto la
-- tienda pública deja de cargar. Son de solo lectura y no filtran nada:
-- devuelven un booleano sobre quien pregunta o sobre un hecho ya público.
revoke all on function public.is_platform_admin()   from public;
revoke all on function public.is_store_member(uuid) from public;
revoke all on function public.is_store_owner(uuid)  from public;
revoke all on function public.store_is_live(uuid)   from public;

grant execute on function public.is_platform_admin()   to anon, authenticated, service_role;
grant execute on function public.is_store_member(uuid) to anon, authenticated, service_role;
grant execute on function public.is_store_owner(uuid)  to anon, authenticated, service_role;
grant execute on function public.store_is_live(uuid)   to anon, authenticated, service_role;

-- ─── Solo el servidor: el navegador nunca las toca ─────────────────────────
revoke all on function public.increment_coupon_redemption(uuid, text) from public;
revoke all on function public.check_availability(jsonb)               from public;

grant execute on function public.increment_coupon_redemption(uuid, text) to service_role;
grant execute on function public.check_availability(jsonb)               to service_role;

-- ─── Panel e inventario: con sesión iniciada o servidor, nunca anon ────────
revoke all on function public.apply_order_inventory(uuid)                     from public;
revoke all on function public.restore_order_inventory(uuid, text)             from public;
revoke all on function public.adjust_variant_stock(uuid, integer, text, text) from public;
revoke all on function public.revert_import_batch(uuid)                       from public;
revoke all on function public.next_order_number(uuid)                         from public;
revoke all on function public.effective_low_stock_threshold(uuid)             from public;
revoke all on function public.store_dashboard(uuid, integer)                  from public;
revoke all on function public.store_sales_series(uuid, integer)               from public;
revoke all on function public.store_sales_by_channel(uuid, integer)           from public;

grant execute on function public.apply_order_inventory(uuid)                     to authenticated, service_role;
grant execute on function public.restore_order_inventory(uuid, text)             to authenticated, service_role;
grant execute on function public.adjust_variant_stock(uuid, integer, text, text) to authenticated, service_role;
grant execute on function public.revert_import_batch(uuid)                       to authenticated, service_role;
grant execute on function public.next_order_number(uuid)                         to authenticated, service_role;
grant execute on function public.effective_low_stock_threshold(uuid)             to authenticated, service_role;
grant execute on function public.store_dashboard(uuid, integer)                  to authenticated, service_role;
grant execute on function public.store_sales_series(uuid, integer)               to authenticated, service_role;
grant execute on function public.store_sales_by_channel(uuid, integer)           to authenticated, service_role;

-- ─── Que las funciones futuras nazcan cerradas ─────────────────────────────
-- Sin esto, la próxima función que agreguemos volvería a nacer abierta a
-- PUBLIC y repetiríamos el mismo agujero sin darnos cuenta.
alter default privileges in schema public revoke execute on functions from public;
