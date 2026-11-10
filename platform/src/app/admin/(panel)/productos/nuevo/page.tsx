import Link from 'next/link';

import { ProductForm } from '@/components/admin/product-form';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { Category } from '@/lib/types';

export default async function NewProductPage() {
  const { store } = await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('store_id', store.id)
    .order('position');

  return (
    <div className="space-y-6">
      <header>
        <nav className="mb-2 text-xs text-ink-mute">
          <Link href="/admin/productos" className="hover:text-ink">Productos</Link>
          <span className="mx-2" aria-hidden>/</span>
          <span className="text-ink">Nuevo</span>
        </nav>
        <h1 className="font-display text-3xl">Nuevo producto</h1>
      </header>

      <ProductForm
        product={null}
        categories={(data ?? []) as Category[]}
        storeThreshold={store.low_stock_threshold}
        currency={store.currency}
      />
    </div>
  );
}
