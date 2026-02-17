'use client'

import { useState } from 'react'
import { CreditCard, CheckCircle2, AlertCircle, ExternalLink, Loader2 } from 'lucide-react'
import type { Organization } from '@/lib/supabase/types'

interface StripeConnectCardProps {
  org: Organization
  userEmail: string
}

export function StripeConnectCard({ org, userEmail }: StripeConnectCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: org.id,
          email: userEmail,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start onboarding')
      }

      // Redirect to Stripe onboarding
      window.location.href = data.url

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const isConnected = org.stripe_account_id && org.stripe_onboarded

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${isConnected ? 'bg-green-100' : 'bg-muted'}`}>
          <CreditCard className={`h-6 w-6 ${isConnected ? 'text-green-600' : 'text-muted-foreground'}`} />
        </div>

        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-1">
            Stripe Connect
          </h2>
          
          {isConnected ? (
            <>
              <div className="flex items-center gap-2 text-green-600 mb-3">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Connected and ready to accept payments</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Your organization is connected to Stripe and can receive payments from course sales.
                Platform fees are automatically deducted.
              </p>
              <a
                href="https://dashboard.stripe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                Open Stripe Dashboard
                <ExternalLink className="h-4 w-4" />
              </a>
            </>
          ) : org.stripe_account_id ? (
            <>
              <div className="flex items-center gap-2 text-yellow-600 mb-3">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Onboarding incomplete</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Your Stripe account is created but onboarding isn&apos;t complete.
                Please finish setting up your account to receive payments.
              </p>
              <button
                onClick={handleConnect}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Continue Setup
              </button>
            </>
          ) : (
            <>
              <p className="text-muted-foreground mb-4">
                Connect your Stripe account to receive payments when students purchase your courses.
                This enables you to set prices and receive payouts directly to your bank account.
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-sm mb-2">What happens when you connect:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• You can set prices for your courses</li>
                  <li>• Students pay via Stripe Checkout</li>
                  <li>• Funds go directly to your bank (minus platform fee)</li>
                  <li>• 10% platform fee on all transactions</li>
                </ul>
              </div>

              {error && (
                <div className="text-sm text-red-600 mb-4 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <button
                onClick={handleConnect}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Connect with Stripe
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
