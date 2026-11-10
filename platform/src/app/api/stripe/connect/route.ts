import { NextResponse, type NextRequest } from 'next/server';

import { getAdminContext, logAudit } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { connectOnboardingUrl, stripe } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * OAuth de Stripe Connect.
 *
 * GET sin `code`  → manda al cliente a conectar SU cuenta de Stripe.
 * GET con `code`  → callback: canjeamos el código por el account id.
 *
 * Lo que NUNCA pasa por aquí: la llave secreta del cliente. Solo guardamos
 * `acct_...`, que por sí solo no sirve para cobrar sin nuestra cuenta de
 * plataforma. El dinero va directo a su cuenta; nosotros nunca lo custodiamos.
 */
export async function GET(request: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Solo el propietario conecta la cuenta de cobro.
  if (ctx.store.role !== 'owner' && !ctx.isPlatformAdmin) {
    return NextResponse.redirect(
      new URL('/admin/configuracion?stripe=sin-permiso', request.url),
    );
  }

  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const stripeError = searchParams.get('error');

  const redirectUri = new URL('/api/stripe/connect', request.url).toString();

  if (stripeError) {
    return NextResponse.redirect(
      new URL('/admin/configuracion?stripe=cancelado', request.url),
    );
  }

  // ── Inicio del flujo ──────────────────────────────────────────────────────
  if (!code) {
    try {
      return NextResponse.redirect(connectOnboardingUrl(ctx.store.id, redirectUri));
    } catch {
      return NextResponse.redirect(
        new URL('/admin/configuracion?stripe=sin-configurar', request.url),
      );
    }
  }

  // ── Callback ──────────────────────────────────────────────────────────────
  // `state` debe coincidir con la tienda activa: así un enlace de callback
  // ajeno no puede enganchar la cuenta de Stripe de otro a esta tienda.
  if (state !== ctx.store.id) {
    return NextResponse.redirect(
      new URL('/admin/configuracion?stripe=estado-invalido', request.url),
    );
  }

  try {
    const token = await stripe().oauth.token({
      grant_type: 'authorization_code',
      code,
    });

    const accountId = token.stripe_user_id;
    if (!accountId) throw new Error('Stripe no devolvió el id de la cuenta.');

    const account = await stripe().accounts.retrieve(accountId);

    const supabase = await createClient();
    const { error } = await supabase
      .from('stores')
      .update({
        stripe_account_id: accountId,
        stripe_charges_enabled: account.charges_enabled ?? false,
        stripe_payouts_enabled: account.payouts_enabled ?? false,
        stripe_onboarded_at: account.charges_enabled ? new Date().toISOString() : null,
      })
      .eq('id', ctx.store.id);

    if (error) throw new Error(error.message);

    await logAudit(ctx.store.id, 'stripe.connect', 'store', ctx.store.id, {
      account_id: accountId,
    });

    return NextResponse.redirect(
      new URL('/admin/configuracion?stripe=conectado', request.url),
    );
  } catch (err) {
    console.error('[connect] OAuth falló:', err);
    return NextResponse.redirect(new URL('/admin/configuracion?stripe=error', request.url));
  }
}
