'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { AuthUser, Organization, OrgMember, OrgContext, User } from '@/lib/supabase/types'

/**
 * Hook to get the current authenticated user.
 * Subscribes to auth state changes.
 */
export function useUser() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchUserProfile = useCallback(async (authUser: SupabaseUser) => {
    const supabase = createClient()
    
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (profileError || !profile) {
      // User might not have a profile yet (trigger might not have fired)
      return {
        id: authUser.id,
        email: authUser.email ?? '',
        fullName: authUser.user_metadata?.full_name ?? null,
        avatarUrl: authUser.user_metadata?.avatar_url ?? null,
        isPlatformAdmin: false,
      }
    }

    const userProfile = profile as User

    return {
      id: userProfile.id,
      email: userProfile.email,
      fullName: userProfile.full_name,
      avatarUrl: userProfile.avatar_url,
      isPlatformAdmin: userProfile.is_platform_admin,
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    const initUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (authUser) {
          const profile = await fetchUserProfile(authUser)
          setUser(profile)
        } else {
          setUser(null)
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch user'))
      } finally {
        setLoading(false)
      }
    }

    initUser()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchUserProfile(session.user)
          setUser(profile)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        } else if (event === 'USER_UPDATED' && session?.user) {
          const profile = await fetchUserProfile(session.user)
          setUser(profile)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchUserProfile])

  return { user, loading, error }
}

/**
 * Hook to get the current organization context.
 * Derives org from URL/subdomain or explicit slug.
 */
export function useOrg(orgSlug?: string) {
  const [org, setOrg] = useState<Organization | null>(null)
  const [membership, setMembership] = useState<OrgMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useUser()

  useEffect(() => {
    if (!orgSlug) {
      setLoading(false)
      return
    }

    const fetchOrg = async () => {
      const supabase = createClient()

      try {
        // Fetch org by slug
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', orgSlug)
          .single()

        if (orgError || !orgData) {
          // Try by custom domain
          const { data: domainOrg } = await supabase
            .from('organizations')
            .select('*')
            .eq('custom_domain', orgSlug)
            .single()

          if (domainOrg) {
            setOrg(domainOrg as Organization)
          } else {
            setOrg(null)
          }
        } else {
          setOrg(orgData as Organization)
        }

        // If user is logged in, fetch their membership
        if (user && orgData) {
          const { data: membershipData } = await supabase
            .from('org_members')
            .select('*')
            .eq('org_id', (orgData as Organization).id)
            .eq('user_id', user.id)
            .single()

          setMembership(membershipData as OrgMember | null)
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch org'))
      } finally {
        setLoading(false)
      }
    }

    fetchOrg()
  }, [orgSlug, user])

  const context: OrgContext | null = org && membership
    ? { org, role: membership.role, membership }
    : null

  return { org, membership, context, loading, error }
}

/**
 * Hook to get all organizations the current user is a member of.
 */
export function useUserOrganizations() {
  const [organizations, setOrganizations] = useState<(OrgMember & { organization: Organization })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useUser()

  useEffect(() => {
    if (!user) {
      setOrganizations([])
      setLoading(false)
      return
    }

    const fetchOrgs = async () => {
      const supabase = createClient()

      try {
        const { data, error: fetchError } = await supabase
          .from('org_members')
          .select(`
            *,
            organization:organizations(*)
          `)
          .eq('user_id', user.id)

        if (fetchError) throw fetchError

        // Filter valid memberships with organizations
        const validMemberships = (data ?? []).filter(
          (m): m is OrgMember & { organization: Organization } =>
            m.organization !== null
        ) as (OrgMember & { organization: Organization })[]

        setOrganizations(validMemberships)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch organizations'))
      } finally {
        setLoading(false)
      }
    }

    fetchOrgs()
  }, [user])

  return { organizations, loading, error }
}
