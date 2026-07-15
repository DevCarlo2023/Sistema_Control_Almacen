import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Usamos getSession() en lugar de getUser() para evitar llamadas de red
  // que causan el error 504 MIDDLEWARE_INVOCATION_TIMEOUT en Vercel.
  // getSession() lee la sesión directamente desde la cookie (sin red).
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const user = session?.user ?? null

  const url = request.nextUrl.clone()

  // --- AUTH REDIRECT LOGIC ---
  // Si no hay usuario y trata de entrar a rutas protegidas, al login
  if (
    !user &&
    (url.pathname.startsWith('/inventory') ||
      url.pathname.startsWith('/equipment') ||
      url.pathname.startsWith('/erp') ||
      (url.pathname.startsWith('/api') && !url.pathname.startsWith('/api/bot')))
  ) {
    const loginUrl = url.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // Si hay usuario y está en login, al dashboard del ERP
  if (user && (url.pathname === '/login' || url.pathname === '/signup' || url.pathname === '/')) {
    const redirectUrl = url.clone()
    redirectUrl.pathname = '/erp/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
