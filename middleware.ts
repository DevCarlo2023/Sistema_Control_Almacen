import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware ultra-liviano para Edge Runtime de Vercel.
 *
 * NO hace llamadas de red a Supabase (eso causaba el error 504).
 * Solo verifica la existencia de la cookie de sesión de Supabase
 * leyéndola directamente — operación instantánea, sin red.
 *
 * Supabase SSR puede fragmentar la cookie en:
 *   sb-<ref>-auth-token        (completa)
 *   sb-<ref>-auth-token.0      (fragmento 0)
 *   sb-<ref>-auth-token.1      (fragmento 1)
 * Por eso usamos `includes('auth-token')` en lugar de `endsWith`.
 */
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const allCookies = request.cookies.getAll()

  // Detectar sesión: cualquier cookie sb-* que contenga 'auth-token'
  // Esto cubre cookies completas y fragmentadas (.0, .1, etc.)
  const hasSession = allCookies.some(
    (cookie) =>
      cookie.name.startsWith('sb-') &&
      cookie.name.includes('auth-token') &&
      cookie.value.length > 10
  )

  // Rutas protegidas — redirigir al login si no hay sesión
  const isProtectedRoute =
    pathname.startsWith('/inventory') ||
    pathname.startsWith('/equipment') ||
    pathname.startsWith('/erp') ||
    (pathname.startsWith('/api') && !pathname.startsWith('/api/bot'))

  if (!hasSession && isProtectedRoute) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // Si ya hay sesión y está en login/signup/root, ir al dashboard
  if (
    hasSession &&
    (pathname === '/login' || pathname === '/signup' || pathname === '/')
  ) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/erp/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  // Ruta de debug — mostrar cookies disponibles (solo en desarrollo)
  if (pathname === '/debug-cookies') {
    return NextResponse.json({
      hasSession,
      cookies: allCookies.map((c) => ({
        name: c.name,
        length: c.value.length,
        preview: c.value.substring(0, 30) + '...',
      })),
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
