import Link from 'next/link';
import { Mail, MessageCircle, Phone } from 'lucide-react';

import type { Store } from '@/lib/types';

export function Footer({ store }: { store: Store }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 bg-ink text-cream/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <span className="wordmark text-xl text-cream">{store.name}</span>
          {store.description && (
            <p className="mt-4 max-w-sm text-sm leading-relaxed">{store.description}</p>
          )}

          <div className="mt-6 space-y-2 text-sm">
            {store.support_email && (
              <a
                href={`mailto:${store.support_email}`}
                className="flex items-center gap-2.5 hover:text-gold-light"
              >
                <Mail className="h-4 w-4" strokeWidth={1.4} aria-hidden />
                {store.support_email}
              </a>
            )}
            {store.support_phone && (
              <a
                href={`tel:${store.support_phone.replace(/[^0-9+]/g, '')}`}
                className="flex items-center gap-2.5 hover:text-gold-light"
              >
                <Phone className="h-4 w-4" strokeWidth={1.4} aria-hidden />
                {store.support_phone}
              </a>
            )}
            {store.whatsapp_number && (
              <a
                href={`https://wa.me/${store.whatsapp_number.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 hover:text-gold-light"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={1.4} aria-hidden />
                WhatsApp
              </a>
            )}
          </div>
        </div>

        <nav aria-labelledby="f-tienda">
          <h3 id="f-tienda" className="mb-4 text-xs uppercase tracking-wideish text-cream">
            Tienda
          </h3>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/tienda" className="hover:text-gold-light">Todos los productos</Link></li>
            <li><Link href="/nosotros" className="hover:text-gold-light">Nosotros</Link></li>
            <li><Link href="/faq" className="hover:text-gold-light">Preguntas frecuentes</Link></li>
            <li><Link href="/contacto" className="hover:text-gold-light">Contacto</Link></li>
          </ul>
        </nav>

        <nav aria-labelledby="f-legal">
          <h3 id="f-legal" className="mb-4 text-xs uppercase tracking-wideish text-cream">
            Información
          </h3>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/envios" className="hover:text-gold-light">Envíos y entregas</Link></li>
            <li><Link href="/devoluciones" className="hover:text-gold-light">Devoluciones</Link></li>
            <li><Link href="/privacidad" className="hover:text-gold-light">Privacidad</Link></li>
            <li><Link href="/terminos" className="hover:text-gold-light">Términos</Link></li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-cream/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {year} {store.name}. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1.5">
            Pagos seguros con <span className="font-semibold text-cream">Stripe</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
