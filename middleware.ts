import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware ultra-liviano para Edge Runtime de Vercel.
 * 
 * NO hace llamadas de red a Supabase (eso causaba el error 504).
 * Solo verifica la existencia de la cookie de sesión de Supabase
 * leyéndola directamente — operación instantánea, sin red.
 * 
 * La verificación real del token (seguridad) ocurre en los
 * Server Components / Route Handlers de cada página protegida.
 */
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Detectar si existe alguna cookie de sesión de Supabase
  const hasSession = request.cookies.getAll().some(
    (cookie) => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
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

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
