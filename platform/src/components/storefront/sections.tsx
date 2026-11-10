import Image from 'next/image';
import Link from 'next/link';
import { CreditCard, Gem, ShieldCheck, Truck } from 'lucide-react';

import type { Category, Store } from '@/lib/types';

/* ── Hero ──────────────────────────────────────────────────────────────── */
export function Hero({ store }: { store: Store }) {
  const t = store.theme ?? {};
  const eyebrow = t.heroEyebrow ?? 'Perfumes árabes e italianos';
  const title = t.heroTitle ?? 'Fragancias que';
  const accent = t.heroTitleAccent ?? 'dejan huella';
  const subtitle =
    t.heroSubtitle ??
    'Descubre una selección exclusiva de perfumes árabes e italianos, con esencias intensas, sofisticadas y duraderas.';

  return (
    <section className="relative isolate overflow-hidden bg-ink text-cream">
      {t.heroImage && (
        <>
          <Image
            src={t.heroImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-right"
          />
          {/* Degradado de izquierda a derecha: garantiza contraste del texto
              sobre cualquier foto, sin depender de cómo sea la imagen. */}
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/20 md:to-transparent" />
        </>
      )}

      <div className="relative mx-auto grid min-h-[30rem] max-w-7xl items-center px-4 py-20 sm:px-6 md:min-h-[34rem] lg:py-28">
        <div className="max-w-xl animate-fade-up">
          <p className="eyebrow text-gold-light/90">{eyebrow}</p>

          <h1 className="mt-5 font-display text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
            {title}
            <br />
            <span className="accent-script">{accent}</span>
          </h1>

          <div className="rule-gold" />

          <p className="mt-6 max-w-md text-[0.95rem] leading-relaxed text-cream/75">
            {subtitle}
          </p>

          <Link href="/tienda" className="btn-gold mt-9 text-[0.8rem] uppercase tracking-wideish">
            {t.heroCta ?? 'Explorar colección'} <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Barra de garantías ────────────────────────────────────────────────── */
const TRUST = [
  { Icon: Gem, title: 'Fragancias Auténticas', text: 'Marcas árabes e italianas originales' },
  { Icon: CreditCard, title: 'Pagos Seguros', text: 'Compra con Stripe con total confianza' },
  { Icon: Truck, title: 'Envío a todo USA', text: 'Rápido y con seguimiento' },
  { Icon: ShieldCheck, title: 'Compra con Confianza', text: 'Atención y soporte personalizado' },
];

export function TrustBar() {
  return (
    <section className="border-b border-line/40 bg-cream-deep/60">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-8 px-4 py-9 sm:px-6 lg:grid-cols-4 lg:divide-x lg:divide-line/50">
        {TRUST.map(({ Icon, title, text }) => (
          <div key={title} className="flex items-start gap-3.5 lg:justify-center lg:px-6">
            <Icon className="mt-0.5 h-6 w-6 shrink-0 text-gold-deep" strokeWidth={1.1} aria-hidden />
            <div className="min-w-0">
              <h3 className="font-sans text-[0.82rem] font-semibold leading-tight">{title}</h3>
              <p className="mt-1 text-[0.72rem] leading-snug text-ink-mute">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Tarjetas de categoría ─────────────────────────────────────────────── */
export function CategoryCards({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="grid gap-5 md:grid-cols-2">
        {categories.slice(0, 2).map((cat) => (
          <Link
            key={cat.id}
            href={`/tienda?categoria=${cat.slug}`}
            className="group relative isolate flex min-h-[15rem] items-end overflow-hidden bg-ink p-8 text-cream"
          >
            {cat.image_url && (
              <>
                <Image
                  src={cat.image_url}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-ink/90 via-ink/55 to-transparent" />
              </>
            )}

            <div className="relative">
              <h3 className="font-display text-4xl leading-[1.08]">{cat.name}</h3>
              {cat.description && (
                <p className="mt-2 text-sm text-cream/75">{cat.description}</p>
              )}
              <span className="mt-6 inline-flex items-center gap-2 border border-cream/40 px-5 py-2.5 text-xs uppercase tracking-wideish transition-colors group-hover:border-gold group-hover:bg-gold group-hover:text-ink">
                Ver colección <span aria-hidden>→</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ── Encabezado de sección ─────────────────────────────────────────────── */
export function SectionHeading({
  children,
  accent,
  href,
  linkLabel,
}: {
  children: React.ReactNode;
  accent?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <h2 className="flex items-center gap-4 font-display text-3xl sm:text-4xl">
        <span className="hidden h-px w-12 bg-gold sm:block" aria-hidden />
        <span>
          {children} {accent && <em className="accent-script not-italic text-gold-deep">{accent}</em>}
        </span>
      </h2>
      {href && (
        <Link href={href} className="text-sm text-ink-mute transition-colors hover:text-gold-deep">
          {linkLabel ?? 'Ver todo'} <span aria-hidden>→</span>
        </Link>
      )}
    </div>
  );
}
