import type { Metadata } from 'next';

import { requireStore } from '@/lib/tenant';

export const revalidate = 3600;
export const metadata: Metadata = { title: 'Nosotros' };

export default async function AboutPage() {
  const store = await requireStore();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="eyebrow">Nuestra historia</p>
      <h1 className="mt-4 font-display text-4xl sm:text-5xl">
        Sobre <span className="accent-script text-gold-deep">{store.name}</span>
      </h1>
      <div className="rule-gold" />

      <div className="mt-8 space-y-5 text-[0.95rem] leading-relaxed text-ink-mute">
        {store.description ? (
          <p>{store.description}</p>
        ) : (
          <p>
            Seleccionamos cada fragancia pensando en quien la va a usar: esencias
            con carácter, duraderas y auténticas, traídas de las casas perfumistas
            que mejor entienden el oficio.
          </p>
        )}
        <p>
          Trabajamos solo con producto original y lo enviamos a todo Estados
          Unidos con seguimiento. Si algo no te convence, lo resolvemos.
        </p>
      </div>
    </div>
  );
}
