-- ============================================================================
-- Datos de demostración: la primera tienda (perfumería).
--
-- Idempotente: se puede correr varias veces sin duplicar nada.
-- Las imágenes usan picsum.photos solo como relleno; en producción se suben
-- al Storage de Supabase desde el panel.
--
-- NO crea usuarios: el acceso se da con scripts/bootstrap-admin.sql después
-- de registrar la cuenta en Supabase Auth.
-- ============================================================================

do $$
declare
  v_store uuid;
  v_arabes uuid;
  v_italianos uuid;
  v_product uuid;
  v_variant uuid;
  r record;
begin
  -- ── Tienda ────────────────────────────────────────────────────────────────
  insert into public.stores (
    slug, name, tagline, description, status, currency, locale,
    low_stock_threshold, support_email, whatsapp_number, alert_emails, theme
  )
  values (
    'candela',
    'Candela Studio',
    'Perfumes árabes e italianos',
    'Una selección exclusiva de perfumes árabes e italianos, con esencias intensas, sofisticadas y duraderas. Envío a todo Estados Unidos.',
    'active', 'USD', 'es-US',
    5,
    'hola@wearecandela.com',
    '+1 305 555 0100',
    array['hola@wearecandela.com'],
    jsonb_build_object(
      'heroEyebrow',    'Perfumes árabes e italianos',
      'heroTitle',      'Fragancias que',
      'heroTitleAccent','dejan huella',
      'heroSubtitle',   'Descubre una selección exclusiva de perfumes árabes e italianos, con esencias intensas, sofisticadas y duraderas.',
      'heroCta',        'Explorar colección',
      'heroImage',      'https://picsum.photos/seed/candela-hero/1600/900'
    )
  )
  on conflict (slug) do update
    set name = excluded.name,
        tagline = excluded.tagline,
        theme = excluded.theme
  returning id into v_store;

  -- ── Categorías ────────────────────────────────────────────────────────────
  insert into public.categories (store_id, slug, name, description, image_url, position)
  values
    (v_store, 'arabes', 'Perfumes Árabes', 'Esencias intensas y exóticas',
     'https://picsum.photos/seed/candela-arabes/1200/700', 0),
    (v_store, 'italianos', 'Perfumes Italianos', 'Elegancia, estilo y sofisticación',
     'https://picsum.photos/seed/candela-italianos/1200/700', 1)
  on conflict (store_id, slug) do update
    set name = excluded.name, image_url = excluded.image_url;

  select id into v_arabes    from public.categories where store_id = v_store and slug = 'arabes';
  select id into v_italianos from public.categories where store_id = v_store and slug = 'italianos';

  -- ── Catálogo ──────────────────────────────────────────────────────────────
  for r in
    select * from (values
      ('asad',           'Asad',             'Lattafa',      v_arabes,    12900,  15900, true,  8, 'Ámbar, tabaco y piña',        'Una apertura fresca de piña que se asienta en ámbar y tabaco. Estela larga, ideal para la noche.'),
      ('oud-royale',     'Oud Royale',       'Ard Al Zaafaran', v_arabes, 15900,  null,  true,  3, 'Oud, azafrán y rosa',         'Oud profundo con azafrán y un corazón de rosa. El clásico árabe en su versión más señorial.'),
      ('bordeaux',       'Bordeaux Intense', 'Armaf',        v_italianos, 11900, 13900, true,  12,'Frutos rojos y vainilla',     'Frutos rojos sobre una base de vainilla y maderas. Dulce sin empalagar.'),
      ('acqua-di-roma',  'Acqua di Roma',    'Maison Rosso', v_italianos,  9900, null,  true,  15,'Bergamota, neroli y cedro',   'Cítrico mediterráneo, limpio y luminoso. Perfecto para diario.'),
      ('yara-rose',      'Yara Rosé',        'Lattafa',      v_arabes,     8900, 10900, true,  2, 'Rosa, vainilla y almizcle',   'Rosa cremosa con vainilla y almizcle. El más vendido entre quienes empiezan en la perfumería árabe.'),
      ('nero-assoluto',  'Nero Assoluto',    'Maison Rosso', v_italianos, 17900, null,  false, 6, 'Cuero, incienso y pachulí',   'Cuero e incienso con un fondo de pachulí. Carácter rotundo para ocasiones especiales.'),
      ('ambra-dorata',   'Ambra Dorata',     'Maison Rosso', v_italianos, 13900, null,  false, 0, 'Ámbar, mirra y sándalo',      'Ámbar dorado con mirra y sándalo. Cálido, envolvente, de temporada fría.'),
      ('musk-al-haramain','Musk Al Haramain','Al Haramain',  v_arabes,     7900, 9900,  false, 20,'Almizcle blanco y algodón',   'Almizcle blanco limpio. Discreto, cercano y duradero sobre la piel.')
    ) as t(slug, name, brand, category, price, compare_at, featured, stock, short_desc, long_desc)
  loop
    insert into public.products (
      store_id, category_id, slug, name, brand, short_description, description,
      status, is_featured, price_cents, compare_at_cents, track_inventory,
      requires_shipping, weight_grams, attributes
    )
    values (
      v_store, r.category, r.slug, r.name, r.brand, r.short_desc, r.long_desc,
      'active', r.featured, r.price, r.compare_at, true,
      true, 350,
      jsonb_build_object(
        'Concentración', 'Eau de Parfum',
        'Origen', case when r.category = v_arabes then 'Emiratos Árabes Unidos' else 'Italia' end,
        'Familia olfativa', r.short_desc
      )
    )
    on conflict (store_id, slug) do update
      set name = excluded.name,
          price_cents = excluded.price_cents,
          is_featured = excluded.is_featured,
          description = excluded.description
    returning id into v_product;

    -- Imágenes
    delete from public.product_images where product_id = v_product;
    insert into public.product_images (store_id, product_id, url, alt, position)
    values
      (v_store, v_product, 'https://picsum.photos/seed/' || r.slug || '-1/800/1000', r.name, 0),
      (v_store, v_product, 'https://picsum.photos/seed/' || r.slug || '-2/800/1000', r.name || ' detalle', 1);

    -- Variantes: 50 ml y 100 ml. El inventario vive aquí, nunca en products.
    insert into public.product_variants (
      store_id, product_id, sku, name, option_name, option_value,
      price_cents, stock, is_default, position
    )
    values (
      v_store, v_product, upper(replace(r.slug, '-', '')) || '-50',
      '50 ml', 'Tamaño', '50 ml',
      round(r.price * 0.7), r.stock, true, 0
    )
    on conflict (store_id, lower(sku)) where sku is not null do nothing;

    insert into public.product_variants (
      store_id, product_id, sku, name, option_name, option_value,
      price_cents, stock, is_default, position
    )
    values (
      v_store, v_product, upper(replace(r.slug, '-', '')) || '-100',
      '100 ml', 'Tamaño', '100 ml',
      r.price, greatest(r.stock - 2, 0), false, 1
    )
    on conflict (store_id, lower(sku)) where sku is not null do nothing;
  end loop;

  -- ── Envíos ────────────────────────────────────────────────────────────────
  -- ground_only: las fragancias con alcohol son mercancía limitada (ORM-D) y
  -- las paqueterías restringen su transporte aéreo.
  insert into public.shipping_rates (
    store_id, name, description, countries, price_cents, free_over_cents,
    min_days, max_days, ground_only, position
  )
  values
    (v_store, 'Envío estándar', 'Terrestre con rastreo', array['US','PR'],
     895, 7500, 3, 7, true, 0),
    (v_store, 'Envío exprés', 'Terrestre prioritario', array['US'],
     1895, null, 2, 3, true, 1)
  on conflict do nothing;

  -- ── Cupón de bienvenida ───────────────────────────────────────────────────
  insert into public.coupons (store_id, code, type, value, min_subtotal_cents)
  values (v_store, 'BIENVENIDO10', 'percent', 10, 5000)
  on conflict do nothing;

  raise notice 'Tienda de demostración lista: %', v_store;
end $$;
