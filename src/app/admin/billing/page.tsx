import { redirect } from 'next/navigation'
import { createServerClient, getUser } from '@/lib/supabase/server'
import { OrgUsageTable } from './_components/org-usage-table'
import { PendingInvoices } from './_components/pending-invoices'
import { BillingStats } from './_components/billing-stats'

export default async function PlatformBillingPage() {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  if (!user.isPlatformAdmin) {
    redirect('/dashboard')
  }

  const supabase = await createServerClient()

  // Get all orgs with their usage
  const { data: orgs } = await supabase
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false })

  // Get usage for each org
  const orgsWithUsage = await Promise.all(
    (orgs ?? []).map(async (org) => {
      const { data: usage } = await supabase.rpc('get_current_usage', { p_org_id: org.id })
      return {
        ...org,
        usage: usage?.[0] ?? {
          active_students: 0,
          video_storage_bytes: 0,
          video_bandwidth_bytes: 0,
          certificates_issued: 0,
          estimated_amount: 0,
        },
      }
    })
  )

  // Get pending/open invoices
  const { data: pendingInvoices } = await supabase
    .from('invoices')
    .select(`
      *,
      organization:organizations(name, slug)
    `)
    .in('status', ['draft', 'open'])
    .order('period_start', { ascending: false })

  // Calculate platform stats
  const totalOrgs = orgs?.length ?? 0
  const totalEstimatedRevenue = orgsWithUsage.reduce(
    (sum, org) => sum + (org.usage?.estimated_amount ?? 0),
    0
  )
  const totalActiveStudents = orgsWithUsage.reduce(
    (sum, org) => sum + (org.usage?.active_students ?? 0),
    0
  )
  const connectedOrgs = orgs?.filter(o => o.stripe_onboarded).length ?? 0

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Platform Billing</h1>
        <p className="text-muted-foreground mt-1">
          Monitor usage across all organizations and manage invoices
        </p>
      </div>

      {/* Stats Overview */}
      <BillingStats
        totalOrgs={totalOrgs}
        connectedOrgs={connectedOrgs}
        totalActiveStudents={totalActiveStudents}
        estimatedRevenue={totalEstimatedRevenue}
      />

      {/* Pending Invoices */}
      <PendingInvoices invoices={pendingInvoices ?? []} />

      {/* All Orgs Usage */}
      <OrgUsageTable orgs={orgsWithUsage} />
    </div>
  )
}
