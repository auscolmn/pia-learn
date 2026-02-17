'use client'

import { Building2, Users, DollarSign, CheckCircle2 } from 'lucide-react'

interface BillingStatsProps {
  totalOrgs: number
  connectedOrgs: number
  totalActiveStudents: number
  estimatedRevenue: number
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(cents / 100)
}

export function BillingStats({
  totalOrgs,
  connectedOrgs,
  totalActiveStudents,
  estimatedRevenue,
}: BillingStatsProps) {
  const stats = [
    {
      label: 'Total Organizations',
      value: totalOrgs,
      icon: Building2,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Stripe Connected',
      value: connectedOrgs,
      subtext: `${totalOrgs > 0 ? Math.round((connectedOrgs / totalOrgs) * 100) : 0}% of orgs`,
      icon: CheckCircle2,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Total Active Students',
      value: totalActiveStudents,
      icon: Users,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Est. Monthly Revenue',
      value: formatCurrency(estimatedRevenue),
      icon: DollarSign,
      color: 'bg-yellow-100 text-yellow-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
              {stat.subtext && (
                <div className="text-xs text-muted-foreground">{stat.subtext}</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
