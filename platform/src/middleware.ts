import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

/**
 * Guardia del panel de administración.
 *
 * Solo corre en /admin/*. La tienda pública NO pasa por aquí, y eso importa
 * por dos razones:
 *
 *   1. Un comprador nunca inicia sesión, así que consultar el servidor de Auth
 *      en cada visita era una llamada de red bloqueante a cambio de nada.
 *   2. Cuando corría en todas las rutas, cualquier fallo aquí tumbaba la
 *      tienda entera con un 500 (MIDDLEWARE_INVOCATION_FAILED), no solo el
 *      panel. Un hipo de Auth no debe impedir vender.
 *
 * Esto es defensa en profundidad, no la única barrera: RLS sigue siendo quien
 * decide qué filas ve cada quien.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === '/admin/login';

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sin credenciales no hay forma de verificar nada. Antes esto reventaba con
  // un 500 ilegible; ahora manda al login, que sí explica qué pasa.
  if (!url || !anonKey) {
    console.error('[middleware] Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY');
    if (isLogin) return NextResponse.next({ request });
    const redirect = request.nextUrl.clone();
    redirect.pathname = '/admin/login';
    redirect.searchParams.set('error', 'config');
    return NextResponse.redirect(redirect);
  }

  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(url, anonKey, {
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
    });

    // getUser() revalida contra el servidor de Auth. getSession() solo lee la
    // cookie y es falsificable: en una ruta protegida no sirve.
    const { data: { user } } = await supabase.auth.getUser();

    if (!user && !isLogin) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = '/admin/login';
      redirect.searchParams.set('next', pathname);
      return NextResponse.redirect(redirect);
    }

    if (user && isLogin) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = '/admin';
      redirect.search = '';
      return NextResponse.redirect(redirect);
    }

    return response;
  } catch (error) {
    // Falla de red, Auth caído, llave mal pegada... Fallamos CERRADO: al
    // login, nunca dejando pasar. Pero sin derribar la petición con un 500.
    console.error('[middleware] No se pudo verificar la sesión:', error);

    if (isLogin) return NextResponse.next({ request });

    const redirect = request.nextUrl.clone();
    redirect.pathname = '/admin/login';
    redirect.searchParams.set('error', 'auth');
    return NextResponse.redirect(redirect);
  }
}

export const config = {
  // SOLO el panel. La tienda pública no necesita sesión y no debe pagar el
  // costo —ni el riesgo— de este middleware.
  matcher: ['/admin/:path*'],
};
