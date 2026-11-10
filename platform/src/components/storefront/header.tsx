'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, Search, ShoppingBag, Truck, ShieldCheck, RotateCcw, User, X } from 'lucide-react';

import { useCart } from './cart-provider';
import type { Store } from '@/lib/types';

const NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/tienda', label: 'Tienda' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contacto', label: 'Contacto' },
];

const BADGES = [
  { Icon: Truck, text: 'Envío a todo Estados Unidos' },
  { Icon: ShieldCheck, text: 'Pagos 100% seguros con Stripe' },
  { Icon: RotateCcw, text: 'Devoluciones fáciles' },
];

export function Header({ store }: { store: Store }) {
  const pathname = usePathname();
  const { count, open, isHydrated } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40">
      {/* Barra de confianza. En móvil solo cabe un mensaje: mostramos el que
          más fricción quita, el envío. */}
      <div className="bg-ink text-cream">
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex flex-1 items-center justify-center gap-10 lg:justify-between lg:px-12">
            {BADGES.map(({ Icon, text }, i) => (
              <span
                key={text}
                className={`flex items-center gap-2 text-[0.7rem] tracking-wide text-cream/85 ${
                  i > 0 ? 'hidden lg:flex' : ''
                }`}
              >
                <Icon className="h-3.5 w-3.5 text-gold-light" strokeWidth={1.5} aria-hidden />
                {text}
              </span>
            ))}
          </div>
          <span className="ml-4 shrink-0 text-[0.7rem] tracking-wide text-cream/70">
            {store.currency}
          </span>
        </div>
      </div>

      <div className="border-b border-line/50 bg-cream/95 backdrop-blur-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="-ml-2 p-2 text-ink lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </button>

          <Link href="/" className="flex shrink-0 flex-col items-center lg:items-start">
            <span className="wordmark text-xl leading-none text-ink sm:text-2xl">
              {store.name}
            </span>
            {store.tagline && (
              <span className="mt-1 hidden text-[0.6rem] uppercase tracking-brand text-ink-mute sm:block">
                {store.tagline}
              </span>
            )}
          </Link>

          <nav className="hidden lg:flex lg:items-center lg:gap-9" aria-label="Principal">
            {NAV.map((item) => {
              const active =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative py-1 text-sm transition-colors ${
                    active ? 'text-ink' : 'text-ink-mute hover:text-ink'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute -bottom-0.5 left-0 h-px w-full bg-gold" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/tienda" className="p-2 text-ink hover:text-gold-deep" aria-label="Buscar">
              <Search className="h-5 w-5" strokeWidth={1.4} />
            </Link>
            <Link
              href="/admin"
              className="hidden p-2 text-ink hover:text-gold-deep sm:block"
              aria-label="Mi cuenta"
            >
              <User className="h-5 w-5" strokeWidth={1.4} />
            </Link>
            <button
              type="button"
              onClick={open}
              className="relative p-2 text-ink hover:text-gold-deep"
              aria-label={`Carrito${isHydrated ? `, ${count} artículos` : ''}`}
            >
              <ShoppingBag className="h-5 w-5" strokeWidth={1.4} />
              {/* Solo tras hidratar: el servidor no conoce el carrito y
                  pintar 0 primero provocaría un parpadeo. */}
              {isHydrated && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-gold px-1 text-[0.65rem] font-semibold text-ink">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-ink/50"
            onClick={() => setMenuOpen(false)}
            aria-label="Cerrar menú"
          />
          <nav className="absolute left-0 top-0 h-full w-72 bg-cream p-6 shadow-lift">
            <div className="mb-8 flex items-center justify-between">
              <span className="wordmark text-lg">{store.name}</span>
              <button onClick={() => setMenuOpen(false)} aria-label="Cerrar">
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>
            <ul className="space-y-1">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="block border-b border-line/40 py-3.5 font-display text-lg text-ink"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
