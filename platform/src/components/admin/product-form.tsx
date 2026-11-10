'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';

import { saveProduct, type ActionState } from '@/app/admin/(panel)/productos/actions';
import { fromCents } from '@/lib/money';
import type { Category, ProductWithRelations } from '@/lib/types';

interface VariantDraft {
  id?: string;
  name: string;
  sku: string;
  price: string;
  stock: number;
  low_stock_threshold: string;
}

export function ProductForm({
  product,
  categories,
  storeThreshold,
  currency,
}: {
  product: ProductWithRelations | null;
  categories: Category[];
  storeThreshold: number;
  currency: string;
}) {
  const action = saveProduct.bind(null, product?.id ?? null);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});

  const [variants, setVariants] = useState<VariantDraft[]>(() => {
    const active = (product?.variants ?? []).filter((v) => v.is_active);
    if (active.length === 0) {
      return [{ name: 'Única', sku: '', price: '', stock: 0, low_stock_threshold: '' }];
    }
    return active.map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku ?? '',
      price: v.price_cents != null ? fromCents(v.price_cents) : '',
      stock: v.stock,
      low_stock_threshold: v.low_stock_threshold != null ? String(v.low_stock_threshold) : '',
    }));
  });

  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <p role="alert" className="border-l-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Columna principal ──────────────────────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">
          <section className="space-y-4 border border-line/60 bg-white p-6">
            <h2 className="font-display text-lg">Información</h2>

            <div>
              <label htmlFor="name" className="label">Nombre *</label>
              <input
                id="name" name="name" required maxLength={160}
                defaultValue={product?.name}
                className="field" placeholder="Oud Fakher Eau de Parfum"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="brand" className="label">Marca</label>
                <input id="brand" name="brand" defaultValue={product?.brand ?? ''} className="field" />
              </div>
              <div>
                <label htmlFor="slug" className="label">URL</label>
                <input
                  id="slug" name="slug" defaultValue={product?.slug ?? ''}
                  className="field" placeholder="se genera del nombre"
                />
              </div>
            </div>

            <div>
              <label htmlFor="short_description" className="label">
                Descripción corta
                <span className="ml-2 normal-case tracking-normal text-ink-mute/70">
                  aparece bajo el título
                </span>
              </label>
              <input
                id="short_description" name="short_description" maxLength={300}
                defaultValue={product?.short_description ?? ''}
                className="field"
              />
            </div>

            <div>
              <label htmlFor="description" className="label">Descripción completa</label>
              <textarea
                id="description" name="description" rows={6} maxLength={5000}
                defaultValue={product?.description ?? ''}
                className="field resize-y"
              />
            </div>
          </section>

          <section className="space-y-4 border border-line/60 bg-white p-6">
            <h2 className="font-display text-lg">Imágenes</h2>
            <p className="text-xs text-ink-mute">
              Una URL por línea. La primera es la portada del producto.
            </p>
            <textarea
              name="images" rows={4}
              defaultValue={(product?.images ?? []).map((i) => i.url).join('\n')}
              className="field resize-y font-mono text-xs"
              placeholder="https://…/perfume-frente.jpg"
            />
          </section>

          {/* ── Variantes ────────────────────────────────────────────────── */}
          <section className="border border-line/60 bg-white p-6">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="font-display text-lg">Presentaciones</h2>
              <button
                type="button"
                onClick={() =>
                  setVariants((prev) => [
                    ...prev,
                    { name: '', sku: '', price: '', stock: 0, low_stock_threshold: '' },
                  ])
                }
                className="flex items-center gap-1.5 text-xs text-ink-mute hover:text-ink"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden /> Agregar
              </button>
            </div>
            <p className="mb-4 text-xs text-ink-mute">
              Tamaños o versiones (50 ml, 100 ml…). El inventario se lleva por
              presentación, no por producto.
            </p>

            <input type="hidden" name="variants" value={JSON.stringify(variants)} />

            <div className="space-y-3">
              {variants.map((variant, i) => (
                <div key={variant.id ?? `new-${i}`} className="grid gap-3 border border-line/50 bg-cream-deep/20 p-3 sm:grid-cols-12">
                  <div className="sm:col-span-4">
                    <label className="label" htmlFor={`v-name-${i}`}>Nombre</label>
                    <input
                      id={`v-name-${i}`} value={variant.name}
                      onChange={(e) => updateVariant(i, { name: e.target.value })}
                      className="field py-2" placeholder="100 ml" required
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="label" htmlFor={`v-sku-${i}`}>SKU</label>
                    <input
                      id={`v-sku-${i}`} value={variant.sku}
                      onChange={(e) => updateVariant(i, { sku: e.target.value })}
                      className="field py-2 font-mono text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label" htmlFor={`v-price-${i}`}>Precio</label>
                    <input
                      id={`v-price-${i}`} value={variant.price} inputMode="decimal"
                      onChange={(e) => updateVariant(i, { price: e.target.value })}
                      className="field py-2" placeholder="base"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label" htmlFor={`v-stock-${i}`}>
                      {variant.id ? 'Stock' : 'Inicial'}
                    </label>
                    <input
                      id={`v-stock-${i}`} type="number" min={0} value={variant.stock}
                      onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })}
                      disabled={Boolean(variant.id)}
                      className="field py-2 tabular-nums disabled:bg-cream-deep/60 disabled:text-ink-mute"
                    />
                  </div>

                  <div className="flex items-end sm:col-span-1">
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setVariants((prev) => prev.filter((_, idx) => idx !== i))}
                        className="p-2 text-ink-mute hover:text-red-700"
                        aria-label={`Quitar ${variant.name || 'presentación'}`}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    )}
                  </div>

                  {variant.id && (
                    <p className="text-[0.7rem] text-ink-mute sm:col-span-12">
                      El stock de una presentación existente se ajusta desde{' '}
                      <Link href="/admin/inventario" className="underline">Inventario</Link>, para
                      que cada movimiento quede registrado.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── Barra lateral ──────────────────────────────────────────────── */}
        <div className="space-y-6">
          <section className="space-y-4 border border-line/60 bg-white p-6">
            <h2 className="font-display text-lg">Publicación</h2>

            <div>
              <label htmlFor="status" className="label">Estado</label>
              <select id="status" name="status" defaultValue={product?.status ?? 'draft'} className="field">
                <option value="draft">Borrador (oculto)</option>
                <option value="active">Publicado</option>
                <option value="archived">Archivado</option>
              </select>
            </div>

            <div>
              <label htmlFor="category_id" className="label">Categoría</label>
              <select
                id="category_id" name="category_id"
                defaultValue={product?.category_id ?? ''}
                className="field"
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <label className="flex items-start gap-2.5 text-sm">
              <input
                type="checkbox" name="is_featured" value="true"
                defaultChecked={product?.is_featured}
                className="mt-0.5 h-4 w-4 accent-[#A87A1E]"
              />
              <span>
                Destacar en la portada
                <span className="block text-xs text-ink-mute">Aparece en “Nuestros Bestseller”</span>
              </span>
            </label>
          </section>

          <section className="space-y-4 border border-line/60 bg-white p-6">
            <h2 className="font-display text-lg">Precio</h2>

            <div>
              <label htmlFor="price" className="label">Precio de venta * ({currency})</label>
              <input
                id="price" name="price" required inputMode="decimal"
                defaultValue={product ? fromCents(product.price_cents) : ''}
                className="field tabular-nums" placeholder="89.00"
              />
            </div>

            <div>
              <label htmlFor="compare_at" className="label">Precio antes (tachado)</label>
              <input
                id="compare_at" name="compare_at" inputMode="decimal"
                defaultValue={product?.compare_at_cents ? fromCents(product.compare_at_cents) : ''}
                className="field tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="cost" className="label">
                Costo
                <span className="ml-2 normal-case tracking-normal text-ink-mute/70">privado</span>
              </label>
              <input
                id="cost" name="cost" inputMode="decimal"
                defaultValue={product?.cost_cents ? fromCents(product.cost_cents) : ''}
                className="field tabular-nums"
              />
            </div>
          </section>

          <section className="space-y-4 border border-line/60 bg-white p-6">
            <h2 className="font-display text-lg">Inventario</h2>

            <label className="flex items-start gap-2.5 text-sm">
              <input
                type="checkbox" name="track_inventory" value="true"
                defaultChecked={product?.track_inventory ?? true}
                className="mt-0.5 h-4 w-4 accent-[#A87A1E]"
              />
              <span>
                Controlar existencias
                <span className="block text-xs text-ink-mute">
                  Descuenta stock con cada venta
                </span>
              </span>
            </label>

            <div>
              <label htmlFor="low_stock_threshold" className="label">Avisarme cuando queden</label>
              <input
                id="low_stock_threshold" name="low_stock_threshold" type="number" min={0}
                defaultValue={product?.low_stock_threshold ?? ''}
                placeholder={`${storeThreshold} (valor de la tienda)`}
                className="field tabular-nums"
              />
              <p className="mt-1.5 text-xs text-ink-mute">
                Déjalo vacío para usar el umbral general de la tienda.
              </p>
            </div>

            <label className="flex items-start gap-2.5 text-sm">
              <input
                type="checkbox" name="requires_shipping" value="true"
                defaultChecked={product?.requires_shipping ?? true}
                className="mt-0.5 h-4 w-4 accent-[#A87A1E]"
              />
              <span>Requiere envío físico</span>
            </label>
          </section>

          <div className="flex gap-3">
            <button type="submit" disabled={pending} className="btn-ink flex-1 py-3">
              {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</> : 'Guardar'}
            </button>
            <Link href="/admin/productos" className="btn-outline px-5 py-3">Cancelar</Link>
          </div>
        </div>
      </div>
    </form>
  );
}
