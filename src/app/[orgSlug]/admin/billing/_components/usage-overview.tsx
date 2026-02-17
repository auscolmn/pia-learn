'use client'

import { Users, HardDrive, Wifi, Award, DollarSign } from 'lucide-react'

interface UsageData {
  active_students: number
  video_storage_bytes: number
  video_bandwidth_bytes: number
  certificates_issued: number
  estimated_amount: number
}

interface PricingConfig {
  price_per_active_student: number
  price_per_gb_storage: number
  price_per_gb_bandwidth: number
  price_per_certificate: number
  free_students_limit: number
  free_storage_gb: number
  free_bandwidth_gb: number
}

interface Feature {
  feature: string
  enabled: boolean
}

interface UsageOverviewProps {
  usage: UsageData
  pricing: PricingConfig | null
  features: Feature[]
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(cents / 100)
}

function bytesToGB(bytes: number): number {
  return bytes / (1024 * 1024 * 1024)
}

export function UsageOverview({ usage, pricing, features }: UsageOverviewProps) {
  const defaultPricing: PricingConfig = {
    price_per_active_student: 200,
    price_per_gb_storage: 10,
    price_per_gb_bandwidth: 5,
    price_per_certificate: 50,
    free_students_limit: 10,
    free_storage_gb: 1,
    free_bandwidth_gb: 5,
  }

  const p = pricing ?? defaultPricing

  // Calculate breakdown
  const studentsOverFree = Math.max(0, usage.active_students - p.free_students_limit)
  const storageGb = bytesToGB(usage.video_storage_bytes)
  const storageOverFree = Math.max(0, storageGb - p.free_storage_gb)
  const bandwidthGb = bytesToGB(usage.video_bandwidth_bytes)
  const bandwidthOverFree = Math.max(0, bandwidthGb - p.free_bandwidth_gb)

  const studentCost = studentsOverFree * p.price_per_active_student
  const storageCost = Math.round(storageOverFree * p.price_per_gb_storage)
  const bandwidthCost = Math.round(bandwidthOverFree * p.price_per_gb_bandwidth)
  const certCost = usage.certificates_issued * p.price_per_certificate

  const usageMetrics = [
    {
      label: 'Active Students',
      value: usage.active_students,
      detail: `${p.free_students_limit} free, then ${formatCurrency(p.price_per_active_student)}/student`,
      icon: Users,
      cost: studentCost,
      overFree: studentsOverFree,
    },
    {
      label: 'Video Storage',
      value: formatBytes(usage.video_storage_bytes),
      detail: `${p.free_storage_gb}GB free, then ${formatCurrency(p.price_per_gb_storage)}/GB`,
      icon: HardDrive,
      cost: storageCost,
      overFree: storageOverFree,
    },
    {
      label: 'Bandwidth',
      value: formatBytes(usage.video_bandwidth_bytes),
      detail: `${p.free_bandwidth_gb}GB free, then ${formatCurrency(p.price_per_gb_bandwidth)}/GB`,
      icon: Wifi,
      cost: bandwidthCost,
      overFree: bandwidthOverFree,
    },
    {
      label: 'Certificates',
      value: usage.certificates_issued,
      detail: `${formatCurrency(p.price_per_certificate)}/certificate`,
      icon: Award,
      cost: certCost,
      overFree: usage.certificates_issued,
    },
  ]

  // Get current month name
  const currentMonth = new Date().toLocaleDateString('en-AU', { 
    month: 'long', 
    year: 'numeric' 
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Current Month Usage</h2>
        <span className="text-sm text-muted-foreground">{currentMonth}</span>
      </div>

      {/* Usage Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {usageMetrics.map((metric) => (
          <div 
            key={metric.label}
            className="bg-card border rounded-lg p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <metric.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium text-sm">{metric.label}</span>
            </div>
            <div className="text-2xl font-bold mb-1">{metric.value}</div>
            <div className="text-xs text-muted-foreground mb-2">{metric.detail}</div>
            {metric.cost > 0 && (
              <div className="text-sm font-medium text-primary">
                +{formatCurrency(metric.cost)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Estimated Bill */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-green-100">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="font-semibold">Estimated Current Bill</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Breakdown */}
          <div className="space-y-2">
            {usageMetrics.map((metric) => (
              metric.cost > 0 && (
                <div key={metric.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{metric.label}</span>
                  <span>{formatCurrency(metric.cost)}</span>
                </div>
              )
            ))}
            {features.length > 0 && (
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-muted-foreground">Feature Add-ons</span>
                <span className="text-muted-foreground">Included</span>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="flex flex-col justify-center items-center p-4 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground mb-1">Estimated Total</span>
            <span className="text-3xl font-bold text-primary">
              {formatCurrency(usage.estimated_amount)}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              Billed at month end
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
