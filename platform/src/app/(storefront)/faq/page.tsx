import type { Metadata } from 'next';

export const revalidate = 3600;
export const metadata: Metadata = { title: 'Preguntas frecuentes' };

const FAQS = [
  {
    q: '¿Los perfumes son originales?',
    a: 'Sí. Trabajamos únicamente con producto original de casas árabes e italianas. Nunca vendemos réplicas ni decants no autorizados.',
  },
  {
    q: '¿A dónde envían?',
    a: 'A todo Estados Unidos, incluido Puerto Rico. Todos los envíos llevan número de rastreo.',
  },
  {
    q: '¿Cuánto tarda mi pedido?',
    a: 'Preparamos el pedido en 1 o 2 días hábiles. La entrega toma normalmente entre 3 y 7 días hábiles según tu estado.',
  },
  {
    q: '¿Por qué los perfumes se envían solo por vía terrestre?',
    a: 'Las fragancias con alcohol se clasifican como mercancía limitada y las paqueterías restringen su transporte aéreo. Por eso los enviamos por tierra: llega un par de días después, pero llega seguro y conforme a la norma.',
  },
  {
    q: '¿Puedo devolver un producto?',
    a: 'Sí, dentro de los primeros 30 días, siempre que el producto esté sin abrir y en su empaque original. Escríbenos y te damos los pasos.',
  },
  {
    q: '¿Es seguro pagar en el sitio?',
    a: 'Totalmente. El cobro lo procesa Stripe, que es quien maneja los datos de tu tarjeta. Nosotros nunca los vemos ni los almacenamos.',
  },
];

export default function FaqPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <p className="eyebrow">Ayuda</p>
      <h1 className="mt-4 font-display text-4xl">Preguntas frecuentes</h1>
      <div className="rule-gold" />

      <dl className="mt-10 divide-y divide-line/50">
        {FAQS.map((faq) => (
          <div key={faq.q} className="py-6">
            <dt className="font-display text-lg">{faq.q}</dt>
            <dd className="mt-2 text-[0.95rem] leading-relaxed text-ink-mute">{faq.a}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
