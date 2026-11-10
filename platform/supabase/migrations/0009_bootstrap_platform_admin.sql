-- ============================================================================
-- Arranque del primer admin de plataforma.
--
-- Problema del huevo y la gallina: prevent_admin_escalation() exigía que quien
-- otorga el nivel ya fuera admin de plataforma. Con la base recién creada no
-- hay ninguno, así que NADIE podía crear al primero — ni siquiera desde el
-- SQL Editor de Supabase. El script scripts/bootstrap-admin.sql simplemente
-- no funcionaba, y solo se descubrió al usarlo contra el proyecto real.
--
-- Regla que se agrega: se permite cuando auth.uid() es NULL, es decir cuando
-- no hay sesión de usuario final. Eso cubre al service_role del backend y a
-- la consola SQL del dueño del proyecto. Es seguro porque:
--   · `anon` también tiene auth.uid() NULL, pero no puede hacer UPDATE sobre
--     profiles: su política solo permite escribir la fila propia estando
--     autenticado (`to authenticated using (id = auth.uid())`).
--   · service_role es backend de confianza, ya verificado antes de llegar aquí.
--
-- Mismo patrón que usan apply_order_inventory y restore_order_inventory.
-- ============================================================================

create or replace function public.prevent_admin_escalation()
returns trigger language plpgsql security definer
set search_path = public, pg_temp as $$
begin
  if new.is_platform_admin is distinct from old.is_platform_admin then
    -- Con sesión de usuario final: solo otro admin de plataforma puede.
    -- Sin sesión (service_role o consola SQL): es el backend, se permite.
    if auth.uid() is not null and not public.is_platform_admin() then
      raise exception 'No puedes modificar el nivel de administrador de plataforma'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.prevent_admin_escalation() from public;
