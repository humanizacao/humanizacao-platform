import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase'

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/avaliacao/responder', // Public survey link
]

// Routes that require specific roles
const ROLE_PROTECTED = {
  '/configuracoes': ['admin_master', 'rh_corporativo'],
  '/relatorios': ['admin_master', 'consultoria', 'rh_corporativo', 'dho', 'sesmt', 'diretoria', 'auditoria'],
  '/api/admin': ['admin_master'],
}

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request)
  const pathname = request.nextUrl.pathname

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return response
  }

  // Allow static files and API routes (they handle auth themselves)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/auth')
  ) {
    return response
  }

  // Check session
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Get user profile for role checks
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active, company_id')
    .eq('id', session.user.id)
    .single()

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login?error=account_inactive', request.url))
  }

  // Role-based access control
  for (const [route, allowedRoles] of Object.entries(ROLE_PROTECTED)) {
    if (pathname.startsWith(route) && !allowedRoles.includes(profile.role)) {
      return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url))
    }
  }

  // Inject company and role into headers for server components
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', session.user.id)
  requestHeaders.set('x-user-role', profile.role)
  requestHeaders.set('x-company-id', profile.company_id || '')

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
