import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createConnectAccount, createOnboardingLink } from '@/lib/stripe'
import type { Organization } from '@/lib/supabase/types'

interface OnboardRequestBody {
  orgId: string
  email: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as OnboardRequestBody
    const { orgId, email } = body

    if (!orgId || !email) {
      return NextResponse.json(
        { error: 'Missing orgId or email' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Get current user and verify they're an admin of this org
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check org membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'You must be an org admin to set up payments' },
        { status: 403 }
      )
    }

    // Get org
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single()

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    const organization = org as Organization

    // Check if org already has a Stripe account
    let stripeAccountId = organization.stripe_account_id

    if (!stripeAccountId) {
      // Create new Connect account
      stripeAccountId = await createConnectAccount({
        orgId: organization.id,
        orgName: organization.name,
        email,
      })

      // Store the account ID
      await supabase
        .from('organizations')
        .update({ stripe_account_id: stripeAccountId })
        .eq('id', orgId)
    }

    // Create onboarding link
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || ''
    const refreshUrl = `${origin}/${organization.slug}/admin/billing?refresh=true`
    const returnUrl = `${origin}/api/stripe/connect/callback?orgId=${orgId}`

    const onboardingUrl = await createOnboardingLink({
      accountId: stripeAccountId,
      refreshUrl,
      returnUrl,
    })

    return NextResponse.json({ url: onboardingUrl })

  } catch (error) {
    console.error('Connect onboard error:', error)
    return NextResponse.json(
      { error: 'Failed to create onboarding session' },
      { status: 500 }
    )
  }
}
