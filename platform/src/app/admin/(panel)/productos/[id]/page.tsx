import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ProductForm } from '@/components/admin/product-form';
import { ArchiveButton } from '@/components/admin/archive-button';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { Category, ProductWithRelations } from '@/lib/types';

type Params = Promise<{ id: string }>;

export default async function EditProductPage({ params }: { params: Params }) {
  const { id } = await params;
  const { store } = await requireAdmin();
  const supabase = await createClient();

  const [productRes, categoriesRes] = await Promise.all([
    supabase
      .from('products')
      .select(`
        *,
        images:product_images(id, product_id, url, alt, position),
        variants:product_variants(*),
        category:categories(id, slug, name)
      `)
      .eq('id', id)
      .eq('store_id', store.id)
      .maybeSingle(),
    supabase.from('categories').select('*').eq('store_id', store.id).order('position'),
  ]);

  if (!productRes.data) notFound();

  const product = productRes.data as unknown as ProductWithRelations;
  product.images = [...(product.images ?? [])].sort((a, b) => a.position - b.position);
  product.variants = [...(product.variants ?? [])].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <nav className="mb-2 text-xs text-ink-mute">
            <Link href="/admin/productos" className="hover:text-ink">Productos</Link>
            <span className="mx-2" aria-hidden>/</span>
            <span className="text-ink">{product.name}</span>
          </nav>
          <h1 className="font-display text-3xl">{product.name}</h1>
          {product.status === 'active' && (
            <a
              href={`/producto/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs text-ink-mute underline hover:text-ink"
            >
              Ver en la tienda
            </a>
          )}
        </div>

        {product.status !== 'archived' && <ArchiveButton productId={product.id} />}
      </header>

      <ProductForm
        product={product}
        categories={(categoriesRes.data ?? []) as Category[]}
        storeThreshold={store.low_stock_threshold}
        currency={store.currency}
      />
    </div>
  );
}
