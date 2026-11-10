import { AlertTriangle, Check, CreditCard, ExternalLink } from 'lucide-react';

import { SettingsForm } from '@/components/admin/settings-form';
import { requireAdmin } from '@/lib/auth';

type SearchParams = Promise<{ stripe?: string }>;

const STRIPE_MESSAGES: Record<string, { text: string; tone: 'ok' | 'warn' }> = {
  conectado: { text: 'Stripe quedó conectado correctamente.', tone: 'ok' },
  cancelado: { text: 'Cancelaste la conexión con Stripe.', tone: 'warn' },
  error: { text: 'No pudimos completar la conexión. Intenta de nuevo.', tone: 'warn' },
  'sin-permiso': { text: 'Solo el propietario puede conectar la cuenta de cobro.', tone: 'warn' },
  'sin-configurar': { text: 'Falta configurar Stripe Connect en la plataforma.', tone: 'warn' },
  'estado-invalido': { text: 'La solicitud no coincide con esta tienda.', tone: 'warn' },
};

export default async function SettingsPage({ searchParams }: { searchParams: SearchParams }) {
  const { store, isPlatformAdmin } = await requireAdmin();
  const { stripe: stripeParam } = await searchParams;

  const message = stripeParam ? STRIPE_MESSAGES[stripeParam] : null;
  const isOwner = store.role === 'owner' || isPlatformAdmin;
  const connected = Boolean(store.stripe_account_id);

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-3xl">Configuración</h1>
        <p className="mt-1 text-sm text-ink-mute">
          Datos de la tienda, alertas y cobros.
        </p>
      </header>

      {message && (
        <p
          role="status"
          className={`border-l-2 px-4 py-3 text-sm ${
            message.tone === 'ok'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
              : 'border-[#A87A1E] bg-[#A87A1E]/10 text-ink'
          }`}
        >
          {message.text}
        </p>
      )}

      <SettingsForm store={store} />

      {/* ── Pagos ──────────────────────────────────────────────────────── */}
      <section id="pagos" className="scroll-mt-6 border border-line/60 bg-white p-6">
        <h2 className="flex items-center gap-2 font-display text-lg">
          <CreditCard className="h-4 w-4 text-ink-mute" strokeWidth={1.5} aria-hidden />
          Cobros con Stripe
        </h2>

        {connected ? (
          <div className="mt-5">
            <div
              className={`flex items-start gap-3 border-l-2 px-4 py-3 ${
                store.stripe_charges_enabled
                  ? 'border-emerald-600 bg-emerald-50'
                  : 'border-[#A87A1E] bg-[#A87A1E]/10'
              }`}
            >
              {store.stripe_charges_enabled ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" strokeWidth={2} aria-hidden />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#A87A1E]" strokeWidth={1.6} aria-hidden />
              )}

              <div className="text-sm">
                <p className="font-medium">
                  {store.stripe_charges_enabled
                    ? 'Tu tienda ya puede recibir pagos'
                    : 'Stripe conectado, pero aún sin habilitar cobros'}
                </p>
                <p className="mt-1 text-xs text-ink-mute">
                  {store.stripe_charges_enabled
                    ? 'Los pagos llegan directo a tu cuenta de Stripe, no a Candela.'
                    : 'Stripe todavía está verificando tu información. Entra a tu panel de Stripe y completa los datos pendientes.'}
                </p>
              </div>
            </div>

            <dl className="mt-5 space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-mute">Cuenta</dt>
                <dd className="break-all text-right font-mono">{store.stripe_account_id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-mute">Depósitos a tu banco</dt>
                <dd>{store.stripe_payouts_enabled ? 'Activos' : 'Pendientes'}</dd>
              </div>
              {store.platform_fee_bps > 0 && (
                <div className="flex justify-between">
                  <dt className="text-ink-mute">Comisión de plataforma</dt>
                  <dd>{(store.platform_fee_bps / 100).toFixed(2)}%</dd>
                </div>
              )}
            </dl>

            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline mt-5 py-2.5 text-sm"
            >
              Abrir mi panel de Stripe
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        ) : (
          <div className="mt-5">
            <p className="text-sm text-ink-mute">
              Conecta tu cuenta de Stripe para empezar a cobrar. Si no tienes una,
              el mismo proceso te deja crearla.
            </p>

            <ul className="mt-4 space-y-2 text-sm">
              {[
                'El dinero de cada venta llega directo a tu cuenta bancaria.',
                'Candela nunca ve ni guarda tus llaves ni tus fondos.',
                'Tú controlas reembolsos y disputas desde tu propio panel.',
              ].map((text) => (
                <li key={text} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" strokeWidth={1.8} aria-hidden />
                  {text}
                </li>
              ))}
            </ul>

            {isOwner ? (
              <a href="/api/stripe/connect" className="btn-gold mt-6 py-3 text-sm">
                Conectar con Stripe
              </a>
            ) : (
              <p className="mt-6 border-l-2 border-line bg-cream-deep/50 px-4 py-3 text-xs text-ink-mute">
                Solo el propietario de la tienda puede conectar la cuenta de cobro.
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── Dominio ────────────────────────────────────────────────────── */}
      <section className="border border-line/60 bg-white p-6">
        <h2 className="font-display text-lg">Dominio</h2>
        <p className="mt-2 text-sm text-ink-mute">
          Tu tienda está publicada en{' '}
          <code className="bg-cream-deep px-1.5 py-0.5 text-xs">
            {store.slug}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'wearecandela.com'}
          </code>
          . Para usar tu propio dominio, escríbenos y lo configuramos.
        </p>
      </section>
    </div>
  );
}
