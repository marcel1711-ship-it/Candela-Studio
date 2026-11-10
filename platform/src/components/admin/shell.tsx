'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  BarChart3, Boxes, ExternalLink, LayoutDashboard, LogOut, Menu, Package,
  Settings, ShoppingCart, Tag, X, Building2, Share2,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { ACTIVE_STORE_COOKIE } from '@/lib/auth.shared';
import type { MemberRole, Store } from '@/lib/types';

const NAV = [
  { href: '/admin',              label: 'Resumen',      Icon: LayoutDashboard, exact: true },
  { href: '/admin/pedidos',      label: 'Pedidos',      Icon: ShoppingCart },
  { href: '/admin/productos',    label: 'Productos',    Icon: Package },
  { href: '/admin/inventario',   label: 'Inventario',   Icon: Boxes },
  { href: '/admin/canales',      label: 'Canales',      Icon: Share2 },
  { href: '/admin/cupones',      label: 'Promociones',  Icon: Tag },
  { href: '/admin/reportes',     label: 'Reportes',     Icon: BarChart3 },
  { href: '/admin/configuracion', label: 'Configuración', Icon: Settings },
];

export function AdminShell({
  store,
  stores,
  email,
  fullName,
  isPlatformAdmin,
  children,
}: {
  store: Store & { role: MemberRole };
  stores: Array<Store & { role: MemberRole }>;
  email: string;
  fullName: string | null;
  isPlatformAdmin: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await createClient().auth.signOut();
    router.replace('/admin/login');
    router.refresh();
  }

  function switchStore(id: string) {
    // Cookie en el cliente + refresh: el servidor la lee en el próximo render.
    document.cookie = `${ACTIVE_STORE_COOKIE}=${id}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-ink text-cream/70">
      <div className="border-b border-cream/10 px-5 py-5">
        <span className="wordmark text-sm text-cream">Candela Hub</span>

        {stores.length > 1 ? (
          <select
            value={store.id}
            onChange={(e) => switchStore(e.target.value)}
            aria-label="Cambiar de tienda"
            className="mt-3 w-full border border-cream/20 bg-ink-soft px-2.5 py-2 text-xs text-cream focus:border-gold focus:outline-none"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        ) : (
          <p className="mt-2 truncate text-xs text-cream/60">{store.name}</p>
        )}

        {store.status !== 'active' && (
          <span className="mt-2 inline-block bg-gold-deep px-2 py-0.5 text-[0.65rem] uppercase tracking-wide text-cream">
            {store.status === 'draft' ? 'Borrador' : 'Suspendida'}
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 p-3" aria-label="Panel">
        {/* Solo el staff de Candela administra la plataforma. El enlace se
            oculta aquí, pero quien manda es requirePlatformAdmin() en el
            servidor: esconder un <Link> nunca es una medida de seguridad. */}
        {isPlatformAdmin && (
          <Link
            href="/admin/plataforma"
            onClick={() => setOpen(false)}
            aria-current={pathname.startsWith('/admin/plataforma') ? 'page' : undefined}
            className={`mb-2 flex items-center gap-3 border border-gold/30 px-3 py-2.5 text-sm transition-colors ${
              pathname.startsWith('/admin/plataforma')
                ? 'bg-gold/20 text-cream'
                : 'text-gold-light hover:bg-gold/10'
            }`}
          >
            <Building2 className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
            Plataforma
          </Link>
        )}

        {NAV.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                active ? 'bg-cream/10 text-cream' : 'hover:bg-cream/5 hover:text-cream'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-cream/10 p-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 text-sm hover:text-cream"
        >
          <ExternalLink className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          Ver mi tienda
        </a>

        <div className="mt-2 border-t border-cream/10 px-3 pt-3">
          <p className="truncate text-xs text-cream">{fullName ?? email}</p>
          <p className="truncate text-[0.7rem] text-cream/50">
            {isPlatformAdmin ? 'Candela Studio' : store.role === 'owner' ? 'Propietario' : 'Equipo'}
          </p>
          <button
            onClick={signOut}
            className="mt-2.5 flex items-center gap-2 text-xs text-cream/60 hover:text-cream"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-cream-deep/40">
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="fixed h-screen w-60">{sidebar}</div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-ink/60" onClick={() => setOpen(false)} aria-label="Cerrar menú" />
          <div className="absolute left-0 top-0 h-full w-60">
            <button
              onClick={() => setOpen(false)}
              className="absolute -right-11 top-3 p-2 text-cream"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3 border-b border-line/50 bg-cream px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(true)} className="p-1" aria-label="Abrir menú">
            <Menu className="h-5 w-5" />
          </button>
          <span className="wordmark text-sm">Candela Hub</span>
        </div>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
