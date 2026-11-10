import 'server-only';

import Stripe from 'stripe';
import type { Store } from '@/lib/types';

/**
 * Stripe Connect — cuentas Standard.
 *
 * Por qué Standard y no Express/Custom:
 *   - El comerciante es el titular de su cuenta; la responsabilidad por
 *     contracargos y reembolsos es suya, no de Candela.
 *   - Stripe hace el KYC. Nosotros nunca vemos, guardamos ni transmitimos
 *     la llave secreta del cliente: solo almacenamos su `acct_...`.
 *   - No añade cuota mensual por cuenta conectada.
 *
 * Candela cobra vía `application_fee_amount` sobre cargos directos.
 */

let cached: Stripe | null = null;

export function stripe(): Stripe {
  if (cached) return cached;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Falta STRIPE_SECRET_KEY');

  cached = new Stripe(key, {
    appInfo: { name: 'Candela Commerce', version: '0.1.0' },
    typescript: true,
  });
  return cached;
}

/** ¿La tienda puede cobrar ahora mismo? */
export function canAcceptPayments(store: Store): boolean {
  return Boolean(store.stripe_account_id) && store.stripe_charges_enabled;
}

/**
 * Comisión de plataforma en centavos.
 * Se calcula sobre el subtotal de producto, nunca sobre envío ni impuestos:
 * cobrarle a Candela un porcentaje del flete sería cobrar por aire.
 */
export function platformFeeCents(store: Store, productSubtotalCents: number): number {
  if (!store.platform_fee_bps) return 0;
  return Math.floor((productSubtotalCents * store.platform_fee_bps) / 10_000);
}

/**
 * Opciones de request para operar EN NOMBRE de la cuenta conectada.
 * Con cargos directos el dinero nunca toca el balance de Candela.
 */
export function onBehalfOf(store: Store): Stripe.RequestOptions {
  if (!store.stripe_account_id) {
    throw new Error(`La tienda ${store.slug} no tiene cuenta de Stripe conectada.`);
  }
  return { stripeAccount: store.stripe_account_id };
}

/** URL de onboarding OAuth: el cliente conecta su propia cuenta de Stripe. */
export function connectOnboardingUrl(storeId: string, redirectUri: string): string {
  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID;
  if (!clientId) throw new Error('Falta STRIPE_CONNECT_CLIENT_ID');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: 'read_write',
    redirect_uri: redirectUri,
    // `state` ata el callback a esta tienda y previene CSRF en el OAuth.
    state: storeId,
    'stripe_user[country]': 'US',
  });

  return `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
}
