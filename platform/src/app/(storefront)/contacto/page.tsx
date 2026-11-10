import type { Metadata } from 'next';
import { Mail, MessageCircle, Phone } from 'lucide-react';

import { requireStore } from '@/lib/tenant';

export const revalidate = 3600;
export const metadata: Metadata = { title: 'Contacto' };

export default async function ContactPage() {
  const store = await requireStore();

  const channels = [
    store.whatsapp_number && {
      Icon: MessageCircle,
      label: 'WhatsApp',
      value: store.whatsapp_number,
      href: `https://wa.me/${store.whatsapp_number.replace(/[^0-9]/g, '')}`,
      note: 'La vía más rápida',
    },
    store.support_email && {
      Icon: Mail,
      label: 'Correo',
      value: store.support_email,
      href: `mailto:${store.support_email}`,
      note: 'Respondemos en menos de 24 h',
    },
    store.support_phone && {
      Icon: Phone,
      label: 'Teléfono',
      value: store.support_phone,
      href: `tel:${store.support_phone.replace(/[^0-9+]/g, '')}`,
      note: 'Lunes a viernes, 9 a 18 h',
    },
  ].filter(Boolean) as Array<{
    Icon: typeof Mail; label: string; value: string; href: string; note: string;
  }>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="eyebrow">Estamos para ayudarte</p>
      <h1 className="mt-4 font-display text-4xl">Contacto</h1>
      <div className="rule-gold" />

      <p className="mt-8 text-[0.95rem] leading-relaxed text-ink-mute">
        ¿Dudas sobre una fragancia, un pedido o una devolución? Escríbenos por
        donde te resulte más cómodo.
      </p>

      {channels.length > 0 ? (
        <ul className="mt-10 space-y-3">
          {channels.map(({ Icon, label, value, href, note }) => (
            <li key={label}>
              <a
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="flex items-center gap-4 border border-line/60 bg-white p-5 transition-colors hover:border-gold-deep"
              >
                <Icon className="h-5 w-5 shrink-0 text-gold-deep" strokeWidth={1.3} aria-hidden />
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wideish text-ink-mute">{label}</p>
                  <p className="truncate text-sm">{value}</p>
                </div>
                <span className="ml-auto hidden shrink-0 text-xs text-ink-mute sm:block">
                  {note}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 border-l-2 border-line bg-cream-deep/50 px-5 py-4 text-sm text-ink-mute">
          Todavía no hay datos de contacto configurados.
        </p>
      )}
    </div>
  );
}
