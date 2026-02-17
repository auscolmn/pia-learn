import { redirect } from 'next/navigation'
import { createServerClient, getUser, getOrgBySlugOrDomain, getOrgMembership } from '@/lib/supabase/server'
import type { Organization } from '@/lib/supabase/types'
import { UsageOverview } from './_components/usage-overview'
import { InvoiceHistory } from './_components/invoice-history'
import { StripeConnectCard } from './_components/stripe-connect-card'

interface PageProps {
  params: Promise<{ orgSlug: string }>
}

async function getBillingData(org: Organization) {
  const supabase = await createServerClient()
  
  // Get current usage via RPC function
  const { data: usageData } = await supabase
    .rpc('get_current_usage', { p_org_id: org.id })

  // Get invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('org_id', org.id)
    .order('period_start', { ascending: false })
    .limit(12)

  // Get pricing config
  const { data: pricing } = await supabase
    .from('pricing_config')
    .select('*')
    .eq('name', 'default')
    .eq('is_active', true)
    .single()

  // Get enabled features
  const { data: features } = await supabase
    .from('org_features')
    .select('*')
    .eq('org_id', org.id)
    .eq('enabled', true)

  return {
    usage: usageData?.[0] ?? {
      active_students: 0,
      video_storage_bytes: 0,
      video_bandwidth_bytes: 0,
      certificates_issued: 0,
      estimated_amount: 0,
    },
    invoices: invoices ?? [],
    pricing: pricing ?? null,
    features: features ?? [],
  }
}

export default async function BillingPage({ params }: PageProps) {
  const { orgSlug } = await params

  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const org = await getOrgBySlugOrDomain(orgSlug)
  if (!org) {
    redirect('/dashboard')
  }

  // Check admin access
  const membership = await getOrgMembership(org.id, user.id)
  if (!membership || membership.role !== 'admin') {
    redirect(`/${orgSlug}`)
  }

  const { usage, invoices, pricing, features } = await getBillingData(org)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing & Usage</h1>
        <p className="text-muted-foreground mt-1">
          Monitor your usage and manage billing settings
        </p>
      </div>

      {/* Stripe Connect Status */}
      <StripeConnectCard 
        org={org}
        userEmail={user.email}
      />

      {/* Current Month Usage */}
      <UsageOverview 
        usage={usage}
        pricing={pricing}
        features={features}
      />

      {/* Invoice History */}
      <InvoiceHistory invoices={invoices} />
    </div>
  )
}
