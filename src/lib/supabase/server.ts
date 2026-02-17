import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { User, Organization, OrgMember, AuthUser, OrgContext, SessionContext } from './types'

/**
 * Create a Supabase client for server-side usage (Server Components, Route Handlers).
 * Automatically handles cookie-based auth.
 */
export async function createServerClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  )
}

/**
 * Get the current authenticated session.
 * Returns null if not authenticated.
 */
export async function getSession() {
  const supabase = await createServerClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session) {
    return null
  }
  
  return session
}

/**
 * Get the current authenticated user with profile data.
 * Returns null if not authenticated.
 */
export async function getUser(): Promise<AuthUser | null> {
  const supabase = await createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  if (!authUser) {
    return null
  }

  // Fetch user profile from our users table
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  const userProfile = profile as User | null

  if (!userProfile) {
    // User exists in auth but not in our table (shouldn't happen with trigger)
    return {
      id: authUser.id,
      email: authUser.email ?? '',
      fullName: authUser.user_metadata?.full_name ?? null,
      avatarUrl: authUser.user_metadata?.avatar_url ?? null,
      isPlatformAdmin: false,
    }
  }

  return {
    id: userProfile.id,
    email: userProfile.email,
    fullName: userProfile.full_name,
    avatarUrl: userProfile.avatar_url,
    isPlatformAdmin: userProfile.is_platform_admin,
  }
}

/**
 * Get organization context from slug or custom domain.
 * Used to determine which org the user is interacting with.
 */
export async function getOrgBySlugOrDomain(
  slugOrDomain: string
): Promise<Organization | null> {
  const supabase = await createServerClient()
  
  // Try slug first
  const { data: orgBySlug } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slugOrDomain)
    .single()

  if (orgBySlug) {
    return orgBySlug as Organization
  }

  // Try custom domain
  const { data: orgByDomain } = await supabase
    .from('organizations')
    .select('*')
    .eq('custom_domain', slugOrDomain)
    .single()

  return (orgByDomain as Organization) ?? null
}

/**
 * Get user's membership in a specific organization.
 */
export async function getOrgMembership(
  orgId: string,
  userId: string
): Promise<OrgMember | null> {
  const supabase = await createServerClient()
  
  const { data: membership } = await supabase
    .from('org_members')
    .select('*')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .single()

  return (membership as OrgMember) ?? null
}

/**
 * Get full organization context for a user.
 * Includes org details and user's role/membership.
 */
export async function getOrgContext(
  slugOrDomain: string,
  userId: string
): Promise<OrgContext | null> {
  const org = await getOrgBySlugOrDomain(slugOrDomain)
  if (!org) return null

  const membership = await getOrgMembership(org.id, userId)
  if (!membership) return null

  return {
    org,
    role: membership.role,
    membership,
  }
}

/**
 * Get complete session context including user and optional org.
 */
export async function getSessionContext(
  orgSlugOrDomain?: string
): Promise<SessionContext | null> {
  const user = await getUser()
  if (!user) return null

  let orgContext: OrgContext | null = null
  if (orgSlugOrDomain) {
    orgContext = await getOrgContext(orgSlugOrDomain, user.id)
  }

  return { user, orgContext }
}

/**
 * Get all organizations the user is a member of.
 */
export async function getUserOrganizations(
  userId: string
): Promise<(OrgMember & { organization: Organization })[]> {
  const supabase = await createServerClient()
  
  const { data: memberships } = await supabase
    .from('org_members')
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq('user_id', userId)

  // Filter out any null organizations and type properly
  const result = (memberships ?? []).filter(
    (m): m is OrgMember & { organization: Organization } => 
      m.organization !== null
  )
  
  return result as (OrgMember & { organization: Organization })[]
}

/**
 * Check if user is enrolled in a course within an org.
 */
export async function isEnrolledInCourse(
  userId: string,
  courseId: string
): Promise<boolean> {
  const supabase = await createServerClient()
  
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .in('status', ['active', 'completed'])
    .single()

  return !!enrollment
}

/**
 * Check if user has admin access to org (either org admin or platform admin).
 */
export async function hasOrgAdminAccess(
  orgId: string,
  userId: string
): Promise<boolean> {
  const user = await getUser()
  if (!user) return false
  
  // Platform admins have access to everything
  if (user.isPlatformAdmin) return true

  const membership = await getOrgMembership(orgId, userId)
  return membership?.role === 'admin'
}
