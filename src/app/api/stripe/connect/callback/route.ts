import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { isAccountReady } from '@/lib/stripe'
import type { Organization } from '@/lib/supabase/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')

    if (!orgId) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    const supabase = await createServerClient()

    // Get org
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single()

    if (orgError || !org) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    const organization = org as Organization

    if (organization.stripe_account_id) {
      // Check if the account is fully onboarded
      const ready = await isAccountReady(organization.stripe_account_id)

      // Update org's onboarded status
      await supabase
        .from('organizations')
        .update({ stripe_onboarded: ready })
        .eq('id', orgId)
    }

    // Redirect to org's billing page
    return NextResponse.redirect(
      new URL(`/${organization.slug}/admin/billing?connected=true`, request.url)
    )

  } catch (error) {
    console.error('Connect callback error:', error)
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
}
