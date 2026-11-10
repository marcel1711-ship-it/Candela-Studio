-- ============================================================================
-- Crear usuarios del panel.
--
-- Dos niveles:
--   · owner de una tienda  → administra esa tienda (lo normal para un cliente)
--   · is_platform_admin    → staff de Candela: ve y administra TODAS las tiendas
--
-- Correr en Supabase → SQL Editor.
-- ============================================================================


-- ─── A) Crear un usuario con contraseña, listo para entrar ─────────────────
-- Alternativa a Authentication → Users → Add user, útil para automatizar.
-- Inserta en auth.users y auth.identities: sin la identidad de tipo "email"
-- el login por contraseña no resuelve. La contraseña se guarda con bcrypt.

do $$
declare
  v_id       uuid := gen_random_uuid();
  v_email    text := 'candelastudio@gmail.com';   -- ← cámbialo
  v_pass     text := 'pon-una-contrasena-larga';  -- ← cámbiala
  v_nombre   text := 'Candela Studio';
  v_existing uuid;
begin
  select id into v_existing from auth.users where lower(email) = lower(v_email);

  if v_existing is not null then
    update auth.users
       set encrypted_password = extensions.crypt(v_pass, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           updated_at = now()
     where id = v_existing;
    v_id := v_existing;
    raise notice 'Usuario ya existía; contraseña actualizada';
  else
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data
    ) values (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      lower(v_email), extensions.crypt(v_pass, extensions.gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', v_nombre)
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_id, v_id::text,
      jsonb_build_object('sub', v_id::text, 'email', lower(v_email), 'email_verified', true),
      'email', now(), now(), now()
    );
    raise notice 'Usuario creado';
  end if;

  insert into public.profiles (id, email, full_name)
  values (v_id, lower(v_email), v_nombre)
  on conflict (id) do update
    set email = excluded.email, full_name = excluded.full_name;
end $$;


-- ─── B) Staff de Candela: acceso a TODAS las tiendas ───────────────────────
-- Funciona desde el SQL Editor porque ahí no hay sesión de usuario final
-- (ver migración 0009). Desde la aplicación, solo otro admin de plataforma.

update public.profiles
   set is_platform_admin = true
 where email = 'candelastudio@gmail.com';   -- ← tu correo


-- ─── C) Dueño de una tienda: lo que se le da a un cliente ──────────────────
-- insert into public.store_members (store_id, user_id, role)
-- select s.id, u.id, 'owner'
-- from public.stores s
-- cross join auth.users u
-- where s.slug = 'candela'                    -- ← slug de la tienda
--   and lower(u.email) = 'cliente@sunegocio.com'
-- on conflict (store_id, user_id) do update set role = 'owner';


-- ─── Verificar ──────────────────────────────────────────────────────────────
select
  u.email,
  p.is_platform_admin as master_admin,
  u.email_confirmed_at is not null as confirmado,
  coalesce(s.name, '—') as tienda,
  coalesce(m.role, '—') as rol
from auth.users u
left join public.profiles p      on p.id = u.id
left join public.store_members m on m.user_id = u.id
left join public.stores s        on s.id = m.store_id
order by u.created_at desc;
