import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import type { Category, ProductWithRelations } from '@/lib/types';

/**
 * Lecturas del storefront.
 *
 * Usan el cliente admin porque corren sin sesión, así que CADA consulta filtra
 * por store_id a mano. Esa cláusula no es opcional: aquí RLS no nos cubre.
 */

const PRODUCT_SELECT = `
  *,
  images:product_images(id, product_id, url, alt, position),
  variants:product_variants(
    id, store_id, product_id, sku, name, option_name, option_value,
    price_cents, compare_at_cents, stock, low_stock_threshold,
    is_default, is_active, position
  ),
  category:categories(id, slug, name)
`;

/** Ordena imágenes y variantes: Postgres no garantiza orden en relaciones anidadas. */
function normalize(row: Record<string, unknown>): ProductWithRelations {
  const product = row as unknown as ProductWithRelations;
  return {
    ...product,
    images: [...(product.images ?? [])].sort((a, b) => a.position - b.position),
    variants: [...(product.variants ?? [])].sort((a, b) => a.position - b.position),
  };
}

export async function getFeaturedProducts(storeId: string, limit = 5) {
  const db = createAdminClient();
  const { data } = await db
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('store_id', storeId)
    .eq('status', 'active')
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []).map(normalize);
}

export async function getProducts(
  storeId: string,
  opts: {
    categorySlug?: string;
    search?: string;
    sort?: 'recientes' | 'precio-asc' | 'precio-desc' | 'nombre';
    limit?: number;
    offset?: number;
  } = {},
): Promise<{ products: ProductWithRelations[]; total: number }> {
  const db = createAdminClient();
  const { categorySlug, search, sort = 'recientes', limit = 24, offset = 0 } = opts;

  let query = db
    .from('products')
    .select(PRODUCT_SELECT, { count: 'exact' })
    .eq('store_id', storeId)
    .eq('status', 'active');

  if (categorySlug) {
    const { data: cat } = await db
      .from('categories')
      .select('id')
      .eq('store_id', storeId)
      .eq('slug', categorySlug)
      .maybeSingle();

    // Categoría inexistente => cero resultados, no el catálogo completo.
    if (!cat) return { products: [], total: 0 };
    query = query.eq('category_id', cat.id);
  }

  if (search?.trim()) {
    // Escapamos comas y paréntesis: rompen la sintaxis de .or() de PostgREST.
    const term = search.trim().replace(/[,()]/g, ' ');
    query = query.or(
      `name.ilike.%${term}%,brand.ilike.%${term}%,short_description.ilike.%${term}%`,
    );
  }

  switch (sort) {
    case 'precio-asc':  query = query.order('price_cents', { ascending: true }); break;
    case 'precio-desc': query = query.order('price_cents', { ascending: false }); break;
    case 'nombre':      query = query.order('name', { ascending: true }); break;
    default:            query = query.order('created_at', { ascending: false });
  }

  const { data, count } = await query.range(offset, offset + limit - 1);
  return { products: (data ?? []).map(normalize), total: count ?? 0 };
}

export async function getProductBySlug(storeId: string, slug: string) {
  const db = createAdminClient();
  const { data } = await db
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('store_id', storeId)
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();

  return data ? normalize(data) : null;
}

export async function getRelatedProducts(
  storeId: string,
  categoryId: string | null,
  excludeId: string,
  limit = 4,
) {
  const db = createAdminClient();
  let query = db
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('store_id', storeId)
    .eq('status', 'active')
    .neq('id', excludeId)
    .limit(limit);

  if (categoryId) query = query.eq('category_id', categoryId);

  const { data } = await query;
  return (data ?? []).map(normalize);
}

export async function getCategories(storeId: string): Promise<Category[]> {
  const db = createAdminClient();
  const { data } = await db
    .from('categories')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_visible', true)
    .order('position');

  return (data ?? []) as Category[];
}
