import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

/**
 * Hace dos cosas en cada request:
 *   1. Refresca la sesión de Supabase (los Server Components no pueden
 *      escribir cookies, así que el refresco tiene que vivir aquí).
 *   2. Cierra /admin a cualquiera sin sesión, ANTES de que se renderice nada.
 *
 * Esto es defensa en profundidad, no la única barrera: RLS sigue siendo
 * quien decide qué filas puede ver cada quien.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: Array<{ name: string; value: string; options?: Partial<ResponseCookie> }>) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() revalida contra el servidor de Auth. getSession() solo lee la
  // cookie y es falsificable: en una ruta protegida no sirve.
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdmin = pathname.startsWith('/admin');
  const isLogin = pathname === '/admin/login';

  if (isAdmin && !isLogin && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (isLogin && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Todo menos estáticos, imágenes y el webhook de Stripe (que se autentica
    // con firma, no con cookies, y no debe pagar el costo de este middleware).
    '/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)',
  ],
};
