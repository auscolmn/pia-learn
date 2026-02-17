import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from './types'

/**
 * Create a Supabase client for middleware usage.
 * Handles cookie reading/writing for auth session refresh.
 */
export async function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  return { supabase, response }
}

/**
 * Extract org context from request (subdomain or custom domain).
 */
export function extractOrgFromRequest(request: NextRequest): string | null {
  const hostname = request.headers.get('host') ?? ''
  const url = new URL(request.url)
  
  // Check for custom domain (not a subdomain of learnstudio)
  const isLearnStudioDomain = hostname.endsWith('.learnstudio.com') || 
                               hostname === 'learnstudio.com' ||
                               hostname.endsWith('.localhost') ||
                               hostname === 'localhost'
  
  if (!isLearnStudioDomain && hostname.includes('.')) {
    // Custom domain - return the full hostname
    return hostname
  }
  
  // Extract subdomain from learnstudio.com or localhost
  // e.g., pia.learnstudio.com → pia
  // e.g., pia.localhost:3000 → pia
  const parts = hostname.split('.')
  
  // For localhost:3000 or learnstudio.com (no subdomain)
  if (parts.length <= 2 || (parts.length === 2 && parts[1].includes(':'))) {
    return null
  }
  
  // For pia.localhost:3000 or pia.learnstudio.com
  const subdomain = parts[0]
  
  // Ignore www
  if (subdomain === 'www') {
    return null
  }
  
  return subdomain
}

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/auth/callback',
  '/auth/confirm',
  '/courses', // Public course catalog (when on org domain)
]

// Routes that require org admin/instructor access
const ORG_ADMIN_ROUTES = [
  '/admin',
  '/admin/courses',
  '/admin/students',
  '/admin/settings',
  '/admin/team',
]

// Platform admin routes
const PLATFORM_ADMIN_ROUTES = [
  '/platform',
  '/platform/orgs',
  '/platform/billing',
]

/**
 * Check if a path matches any of the route patterns.
 */
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some(route => {
    if (route === pathname) return true
    // Match route prefixes (e.g., /admin matches /admin/courses)
    if (pathname.startsWith(route + '/')) return true
    return false
  })
}

/**
 * Main auth middleware handler.
 */
export async function updateSession(request: NextRequest) {
  const { supabase, response } = await createMiddlewareClient(request)
  
  // Refresh session if needed
  const { data: { user } } = await supabase.auth.getUser()
  
  const pathname = request.nextUrl.pathname
  const orgSlug = extractOrgFromRequest(request)
  
  // Public routes - allow through
  if (matchesRoute(pathname, PUBLIC_ROUTES)) {
    // If user is logged in and tries to access login/register, redirect to dashboard
    if (user && (pathname === '/login' || pathname === '/register')) {
      const redirectUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(redirectUrl)
    }
    return response
  }
  
  // Static files and API routes - pass through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // Static files
  ) {
    return response
  }
  
  // All other routes require authentication
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Platform admin routes - check platform admin access
  if (matchesRoute(pathname, PLATFORM_ADMIN_ROUTES)) {
    const { data: profile } = await supabase
      .from('users')
      .select('is_platform_admin')
      .eq('id', user.id)
      .single()
    
    if (!profile?.is_platform_admin) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response
  }
  
  // Org admin routes - check org membership
  if (matchesRoute(pathname, ORG_ADMIN_ROUTES) && orgSlug) {
    // Get org by slug or custom domain
    let orgQuery = supabase.from('organizations').select('id')
    
    // Check if it's a custom domain or slug
    if (orgSlug.includes('.')) {
      orgQuery = orgQuery.eq('custom_domain', orgSlug)
    } else {
      orgQuery = orgQuery.eq('slug', orgSlug)
    }
    
    const { data: org } = await orgQuery.single()
    
    if (!org) {
      // Org not found
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    // Check user membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', org.id)
      .eq('user_id', user.id)
      .single()
    
    if (!membership) {
      // User is not an org member
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    // User has access - add org context to headers
    response.headers.set('x-org-id', org.id)
    response.headers.set('x-org-role', membership.role)
    return response
  }
  
  return response
}
