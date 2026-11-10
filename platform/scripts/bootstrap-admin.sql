-- ============================================================================
-- Dar acceso al panel a una cuenta ya registrada.
--
-- Pasos:
--   1. Supabase → Authentication → Users → "Add user" (con contraseña).
--   2. Sustituye el correo abajo y corre esto en el SQL Editor.
--
-- Hay dos niveles:
--   · owner de una tienda  → administra esa tienda (lo normal para un cliente)
--   · is_platform_admin    → staff de Candela: ve y administra TODAS las tiendas
-- ============================================================================

-- ── A) Dueño de una tienda (lo que se le da a un cliente) ───────────────────
insert into public.store_members (store_id, user_id, role)
select s.id, u.id, 'owner'
from public.stores s
cross join auth.users u
where s.slug = 'candela'                        -- ← slug de la tienda
  and u.email = 'cliente@sunegocio.com'         -- ← correo del cliente
on conflict (store_id, user_id) do update set role = 'owner';

-- ── B) Staff de Candela (acceso a todas las tiendas) ────────────────────────
-- update public.profiles
--    set is_platform_admin = true
--  where email = 'tu@wearecandela.com';        -- ← tu correo

-- ── Verificar ───────────────────────────────────────────────────────────────
select u.email, p.is_platform_admin, s.name as tienda, m.role
from auth.users u
left join public.profiles p on p.id = u.id
left join public.store_members m on m.user_id = u.id
left join public.stores s on s.id = m.store_id
order by u.created_at desc;
