import type { Metadata } from 'next';

import { CartProvider } from '@/components/storefront/cart-provider';
import { CartDrawer } from '@/components/storefront/cart-drawer';
import { Header } from '@/components/storefront/header';
import { Footer } from '@/components/storefront/footer';
import { getCurrentStore, themeToCssVars } from '@/lib/tenant';

export async function generateMetadata(): Promise<Metadata> {
  const store = await getCurrentStore();
  if (!store) return { title: 'Tienda no encontrada' };

  return {
    title: { default: store.name, template: `%s · ${store.name}` },
    description: store.description ?? store.tagline ?? undefined,
    openGraph: {
      title: store.name,
      description: store.description ?? undefined,
      type: 'website',
      locale: store.locale,
      siteName: store.name,
    },
    icons: store.favicon_url ? { icon: store.favicon_url } : undefined,
  };
}

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = await getCurrentStore();

  // Dominio sin tienda asignada. Pasa en producción cuando alguien apunta un
  // DNS antes de que provisionemos el tenant: mejor un mensaje claro que un 500.
  if (!store) {
    return (
      <main className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <h1 className="font-display text-3xl">Tienda no disponible</h1>
          <p className="mt-3 max-w-md text-sm text-ink-mute">
            Este dominio todavía no tiene una tienda configurada. Si eres el
            propietario, termina la configuración desde el panel de Candela.
          </p>
        </div>
      </main>
    );
  }

  if (store.status === 'suspended') {
    return (
      <main className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <h1 className="font-display text-3xl">{store.name}</h1>
          <p className="mt-3 text-sm text-ink-mute">
            La tienda está temporalmente fuera de servicio.
          </p>
        </div>
      </main>
    );
  }

  return (
    // El tema del tenant entra como variables CSS inline: un solo build sirve
    // a todas las tiendas, cada una con su paleta.
    <div style={themeToCssVars(store)} className="flex min-h-screen flex-col">
      <CartProvider storeId={store.id}>
        {store.status === 'draft' && (
          <div className="bg-gold-deep px-4 py-2 text-center text-xs font-medium text-cream">
            Modo borrador · solo visible para el equipo
          </div>
        )}
        <Header store={store} />
        <main className="flex-1">{children}</main>
        <Footer store={store} />
        <CartDrawer store={store} />
      </CartProvider>
    </div>
  );
}
