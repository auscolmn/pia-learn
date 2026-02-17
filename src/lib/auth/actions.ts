'use server'

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/lib/supabase/types'

type SupabaseClient = Awaited<ReturnType<typeof createServerClient>>

export interface AuthActionResult {
  success: boolean
  error?: string
  redirectTo?: string
}

/**
 * Sign in with email and password.
 */
export async function signInWithEmail(
  email: string,
  password: string,
  redirectTo?: string
): Promise<AuthActionResult> {
  const supabase = await createServerClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/', 'layout')
  
  return { 
    success: true, 
    redirectTo: redirectTo ?? '/dashboard' 
  }
}

/**
 * Sign up with email and password.
 * Optionally creates a new organization.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
  options?: {
    createOrg?: boolean
    orgName?: string
    orgSlug?: string
  }
): Promise<AuthActionResult> {
  const supabase = await createServerClient()

  // Create auth user
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (signUpError) {
    return { success: false, error: signUpError.message }
  }

  if (!data.user) {
    return { success: false, error: 'Failed to create user' }
  }

  // If creating org, do it here
  if (options?.createOrg && options.orgName && options.orgSlug) {
    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(options.orgSlug)) {
      return { 
        success: false, 
        error: 'Organization slug can only contain lowercase letters, numbers, and hyphens' 
      }
    }

    // Create organization
    type OrgInsert = Database['public']['Tables']['organizations']['Insert']
    const orgInsert: OrgInsert = {
      name: options.orgName,
      slug: options.orgSlug,
      plan: 'free',
      primary_color: '#6366F1',
      secondary_color: '#818CF8',
      settings: {},
    }

    const { data: org, error: orgError } = await (supabase as unknown as SupabaseClient)
      .from('organizations')
      .insert(orgInsert as never)
      .select()
      .single()

    if (orgError) {
      // Check for duplicate slug
      if (orgError.code === '23505') {
        return { success: false, error: 'This organization URL is already taken' }
      }
      return { success: false, error: `Failed to create organization: ${orgError.message}` }
    }

    // Add user as admin of the org
    type MemberInsert = Database['public']['Tables']['org_members']['Insert']
    const memberInsert: MemberInsert = {
      org_id: (org as { id: string }).id,
      user_id: data.user.id,
      role: 'admin',
    }

    const { error: memberError } = await (supabase as unknown as SupabaseClient)
      .from('org_members')
      .insert(memberInsert as never)

    if (memberError) {
      return { success: false, error: `Failed to add you to organization: ${memberError.message}` }
    }

    revalidatePath('/', 'layout')
    return { 
      success: true, 
      redirectTo: `/${options.orgSlug}/admin` 
    }
  }

  revalidatePath('/', 'layout')
  return { success: true, redirectTo: '/dashboard' }
}

/**
 * Sign in with OAuth provider (Google, etc.).
 */
export async function signInWithOAuth(
  provider: 'google' | 'github',
  redirectTo?: string
): Promise<AuthActionResult> {
  const supabase = await createServerClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?redirect=${redirectTo ?? '/dashboard'}`,
    },
  })

  if (error) {
    return { success: false, error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }

  return { success: true }
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<AuthActionResult> {
  const supabase = await createServerClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}

/**
 * Request password reset email.
 */
export async function resetPassword(email: string): Promise<AuthActionResult> {
  const supabase = await createServerClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=recovery`,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Update user's password (when authenticated or with recovery token).
 */
export async function updatePassword(newPassword: string): Promise<AuthActionResult> {
  const supabase = await createServerClient()

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true, redirectTo: '/dashboard' }
}

/**
 * Update user profile.
 */
export async function updateProfile(
  fullName: string,
  avatarUrl?: string
): Promise<AuthActionResult> {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Update auth metadata
  const { error: authError } = await supabase.auth.updateUser({
    data: {
      full_name: fullName,
      avatar_url: avatarUrl,
    },
  })

  if (authError) {
    return { success: false, error: authError.message }
  }

  // Update users table
  const { error: profileError } = await (supabase as unknown as SupabaseClient)
    .from('users')
    .update({
      full_name: fullName,
      avatar_url: avatarUrl ?? null,
    } as never)
    .eq('id', user.id)

  if (profileError) {
    return { success: false, error: profileError.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

/**
 * Join an organization (for enrolled students or invited members).
 */
export async function joinOrganization(
  orgSlug: string,
  _inviteCode?: string
): Promise<AuthActionResult> {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Find the organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single()

  if (orgError || !org) {
    return { success: false, error: 'Organization not found' }
  }

  const orgId = (org as { id: string }).id

  // Check if already a member
  const { data: existing } = await supabase
    .from('org_members')
    .select('id')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    return { success: true, redirectTo: `/${orgSlug}` }
  }

  // TODO: Validate invite code if provided
  // For now, anyone can join as instructor (adjust based on invite system)
  
  type MemberInsert = Database['public']['Tables']['org_members']['Insert']
  const memberInsert: MemberInsert = {
    org_id: orgId,
    user_id: user.id,
    role: 'instructor',
  }

  const { error: memberError } = await (supabase as unknown as SupabaseClient)
    .from('org_members')
    .insert(memberInsert as never)

  if (memberError) {
    return { success: false, error: 'Failed to join organization' }
  }

  revalidatePath('/', 'layout')
  return { success: true, redirectTo: `/${orgSlug}` }
}
