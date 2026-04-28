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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'carlotech.com'

  // --- SUBDOMAIN ROUTING LOGIC ---
  // Detect if the request is coming from the ERP subdomain
  const isERPSubdomain =
    hostname.startsWith('erp.') ||
    hostname === `erp.${rootDomain}` ||
    hostname === `erp.localhost` ||
    hostname === `erp.localhost:3000`

  // Detect if the request is coming from the Almacen subdomain
  const isAlmacenSubdomain =
    hostname.startsWith('almacen.') ||
    hostname === `almacen.${rootDomain}` ||
    hostname === `almacen.localhost` ||
    hostname === `almacen.localhost:3000`

  if (isERPSubdomain) {
    // Rewrite the ERP subdomain root to the ERP dashboard
    if (url.pathname === '/' || url.pathname === '') {
      url.pathname = '/erp/dashboard'
      return NextResponse.rewrite(url)
    }
    // Forward all ERP subdomain paths to the /erp/* directory
    if (!url.pathname.startsWith('/erp')) {
      url.pathname = `/erp${url.pathname}`
      return NextResponse.rewrite(url)
    }
  }

  // --- AUTH REDIRECT LOGIC ---
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

  // Redirect authenticated users away from login/signup
  if (user && (url.pathname === '/login' || url.pathname === '/signup')) {
    const redirectUrl = url.clone()
    redirectUrl.pathname = isERPSubdomain ? '/erp/dashboard' : '/inventory'
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
