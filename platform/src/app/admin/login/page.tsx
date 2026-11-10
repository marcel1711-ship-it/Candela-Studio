import type { Metadata } from 'next';
import { Suspense } from 'react';

import { LoginForm } from '@/components/admin/login-form';

export const metadata: Metadata = {
  title: 'Acceso al panel',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-cream px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <span className="wordmark text-2xl">Candela Hub</span>
          <p className="mt-2 text-xs uppercase tracking-wideish text-ink-mute">
            Panel de administración
          </p>
        </div>

        <div className="border border-line/60 bg-white p-8 shadow-card">
          {/* LoginForm lee ?next= con useSearchParams, que obliga a Next a
              renderizarlo en cliente: sin este límite el prerender falla. */}
          <Suspense fallback={<div className="h-64 skeleton" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-ink-mute">
          ¿Problemas para entrar? Escribe a soporte.
        </p>
      </div>
    </main>
  );
}
