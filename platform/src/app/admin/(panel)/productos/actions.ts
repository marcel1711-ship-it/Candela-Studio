'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { logAudit, requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { toCents } from '@/lib/money';

/**
 * Server actions del catálogo.
 *
 * Todas usan el cliente con sesión, así que RLS valida la pertenencia a la
 * tienda por su cuenta. El .eq('store_id') adicional es defensa en profundidad:
 * si una política se relajara por error, el filtro sigue ahí.
 */

export interface ActionState {
  error?: string;
  ok?: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // quita acentos: "Ámbar" -> "ambar"
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const VariantSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  sku: z.string().trim().max(60).optional(),
  price: z.string().optional(),
  stock: z.coerce.number().int().min(0).max(1_000_000),
  low_stock_threshold: z.string().optional(),
});

const ProductSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es obligatorio.').max(160),
  slug: z.string().trim().max(80).optional(),
  brand: z.string().trim().max(80).optional(),
  short_description: z.string().trim().max(300).optional(),
  description: z.string().trim().max(5000).optional(),
  category_id: z.string().uuid().optional().or(z.literal('')),
  status: z.enum(['draft', 'active', 'archived']),
  is_featured: z.coerce.boolean(),
  price: z.string().min(1, 'El precio es obligatorio.'),
  compare_at: z.string().optional(),
  cost: z.string().optional(),
  track_inventory: z.coerce.boolean(),
  low_stock_threshold: z.string().optional(),
  requires_shipping: z.coerce.boolean(),
  images: z.string().optional(),
  variants: z.string().optional(),
});

function parseOptionalCents(value: string | undefined): number | null {
  if (!value || !value.trim()) return null;
  return toCents(value);
}

function parseOptionalInt(value: string | undefined): number | null {
  if (!value || !value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

export async function saveProduct(
  productId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { store } = await requireAdmin();
  const supabase = await createClient();

  const parsed = ProductSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos del formulario.' };
  }

  const d = parsed.data;
  const slug = slugify(d.slug || d.name);

  if (!slug) return { error: 'No pudimos generar una URL válida a partir del nombre.' };

  // El slug es la URL pública: si choca, el cliente debe saberlo antes de
  // guardar, no toparse con un error de base de datos.
  const { data: clash } = await supabase
    .from('products')
    .select('id')
    .eq('store_id', store.id)
    .eq('slug', slug)
    .maybeSingle();

  if (clash && clash.id !== productId) {
    return { error: `Ya existe otro producto con la URL "${slug}". Cámbiala.` };
  }

  const payload = {
    store_id: store.id,
    name: d.name,
    slug,
    brand: d.brand || null,
    short_description: d.short_description || null,
    description: d.description || null,
    category_id: d.category_id || null,
    status: d.status,
    is_featured: d.is_featured,
    price_cents: toCents(d.price),
    compare_at_cents: parseOptionalCents(d.compare_at),
    cost_cents: parseOptionalCents(d.cost),
    track_inventory: d.track_inventory,
    low_stock_threshold: parseOptionalInt(d.low_stock_threshold),
    requires_shipping: d.requires_shipping,
  };

  let id = productId;

  if (id) {
    const { error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', id)
      .eq('store_id', store.id);

    if (error) return { error: `No pudimos guardar: ${error.message}` };
  } else {
    const { data, error } = await supabase
      .from('products')
      .insert(payload)
      .select('id')
      .single();

    if (error || !data) return { error: `No pudimos crear el producto: ${error?.message}` };
    id = data.id;
  }

  // ── Imágenes ──────────────────────────────────────────────────────────────
  const urls = (d.images ?? '')
    .split('\n')
    .map((u) => u.trim())
    .filter((u) => /^https?:\/\//i.test(u))
    .slice(0, 10);

  await supabase.from('product_images').delete().eq('product_id', id).eq('store_id', store.id);

  if (urls.length > 0) {
    await supabase.from('product_images').insert(
      urls.map((url, position) => ({ store_id: store.id, product_id: id!, url, position })),
    );
  }

  // ── Variantes ─────────────────────────────────────────────────────────────
  // Nunca borramos y recreamos: eso perdería el historial de inventario y
  // rompería los order_items que apuntan a cada variante.
  let variants: z.infer<typeof VariantSchema>[] = [];
  try {
    const raw = JSON.parse(d.variants || '[]');
    variants = z.array(VariantSchema).parse(raw);
  } catch {
    variants = [];
  }

  if (variants.length === 0) {
    variants = [{ name: 'Única', stock: 0, sku: undefined, price: undefined, low_stock_threshold: undefined }];
  }

  const { data: existing } = await supabase
    .from('product_variants')
    .select('id')
    .eq('product_id', id)
    .eq('store_id', store.id);

  const keptIds = new Set(variants.map((v) => v.id).filter(Boolean) as string[]);

  for (const stale of existing ?? []) {
    if (!keptIds.has(stale.id)) {
      // Desactivar, no borrar: un pedido histórico sigue apuntando a esta fila.
      await supabase
        .from('product_variants')
        .update({ is_active: false })
        .eq('id', stale.id)
        .eq('store_id', store.id);
    }
  }

  for (const [position, v] of variants.entries()) {
    const variantPayload = {
      store_id: store.id,
      product_id: id!,
      name: v.name,
      sku: v.sku || null,
      price_cents: parseOptionalCents(v.price),
      low_stock_threshold: parseOptionalInt(v.low_stock_threshold),
      is_default: position === 0,
      is_active: true,
      position,
    };

    if (v.id) {
      // El stock NO se toca aquí: se mueve solo por adjust_variant_stock, para
      // que la bitácora de inventario nunca quede desfasada de la realidad.
      await supabase
        .from('product_variants')
        .update(variantPayload)
        .eq('id', v.id)
        .eq('store_id', store.id);
    } else {
      const { data: created } = await supabase
        .from('product_variants')
        .insert({ ...variantPayload, stock: 0 })
        .select('id')
        .single();

      if (created && v.stock > 0) {
        await supabase.rpc('adjust_variant_stock', {
          p_variant_id: created.id,
          p_delta: v.stock,
          p_reason: 'initial',
          p_note: 'Stock inicial al crear la variante',
        });
      }
    }
  }

  await logAudit(store.id, productId ? 'product.update' : 'product.create', 'product', id, {
    name: d.name,
    status: d.status,
  });

  revalidatePath('/admin/productos');
  revalidatePath('/');
  revalidatePath('/tienda');
  revalidatePath(`/producto/${slug}`);

  redirect(`/admin/productos?guardado=${id}`);
}

export async function deleteProduct(productId: string) {
  const { store } = await requireAdmin();
  const supabase = await createClient();

  // Archivar, no eliminar: borrar un producto dejaría pedidos históricos
  // sin referencia y falsearía los reportes de meses anteriores.
  const { error } = await supabase
    .from('products')
    .update({ status: 'archived', is_featured: false })
    .eq('id', productId)
    .eq('store_id', store.id);

  if (error) throw new Error(error.message);

  await logAudit(store.id, 'product.archive', 'product', productId);

  revalidatePath('/admin/productos');
  revalidatePath('/tienda');
}

export async function setStock(variantId: string, delta: number, note?: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.rpc('adjust_variant_stock', {
    p_variant_id: variantId,
    p_delta: delta,
    p_reason: delta > 0 ? 'restock' : 'adjustment',
    p_note: note ?? null,
  });

  if (error) throw new Error(error.message);

  revalidatePath('/admin/inventario');
  revalidatePath('/admin');
}
