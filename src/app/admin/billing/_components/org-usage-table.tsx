'use client'

import Link from 'next/link'
import { ExternalLink, Users, HardDrive, Award } from 'lucide-react'
import type { Organization } from '@/lib/supabase/types'

interface UsageData {
  active_students: number
  video_storage_bytes: number
  video_bandwidth_bytes: number
  certificates_issued: number
  estimated_amount: number
}

interface OrgWithUsage extends Organization {
  usage: UsageData
}

interface OrgUsageTableProps {
  orgs: OrgWithUsage[]
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(cents / 100)
}

export function OrgUsageTable({ orgs }: OrgUsageTableProps) {
  // Sort by estimated amount descending
  const sortedOrgs = [...orgs].sort(
    (a, b) => b.usage.estimated_amount - a.usage.estimated_amount
  )

  return (
    <div className="bg-card border rounded-lg">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold">Organization Usage</h2>
        <p className="text-sm text-muted-foreground">
          Current month usage across all organizations
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-4 font-medium text-sm">Organization</th>
              <th className="text-left p-4 font-medium text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Students
                </div>
              </th>
              <th className="text-left p-4 font-medium text-sm">
                <div className="flex items-center gap-1">
                  <HardDrive className="h-4 w-4" />
                  Storage
                </div>
              </th>
              <th className="text-left p-4 font-medium text-sm">
                <div className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  Certs
                </div>
              </th>
              <th className="text-left p-4 font-medium text-sm">Stripe</th>
              <th className="text-right p-4 font-medium text-sm">Est. Bill</th>
              <th className="text-right p-4 font-medium text-sm"></th>
            </tr>
          </thead>
          <tbody>
            {sortedOrgs.map((org) => (
              <tr key={org.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {org.logo_url ? (
                      <img 
                        src={org.logo_url} 
                        alt="" 
                        className="h-8 w-8 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {org.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{org.name}</div>
                      <div className="text-xs text-muted-foreground">{org.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="font-mono">{org.usage.active_students}</span>
                </td>
                <td className="p-4">
                  <span className="font-mono text-sm">
                    {formatBytes(org.usage.video_storage_bytes)}
                  </span>
                </td>
                <td className="p-4">
                  <span className="font-mono">{org.usage.certificates_issued}</span>
                </td>
                <td className="p-4">
                  {org.stripe_onboarded ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Connected
                    </span>
                  ) : org.stripe_account_id ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      Pending
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                      Not Set Up
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <span className="font-mono font-medium">
                    {formatCurrency(org.usage.estimated_amount)}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Link
                    href={`/${org.slug}/admin/billing`}
                    className="p-2 hover:bg-muted rounded-lg transition-colors inline-flex"
                    title="View org billing"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {orgs.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          No organizations yet
        </div>
      )}
    </div>
  )
}
