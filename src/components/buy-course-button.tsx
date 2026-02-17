'use client'

import { useState } from 'react'
import { ShoppingCart, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BuyCourseButtonProps {
  courseId: string
  courseTitle: string
  price: number
  currency: string
  orgSlug: string
  disabled?: boolean
  className?: string
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount)
}

export function BuyCourseButton({
  courseId,
  courseTitle,
  price,
  currency,
  orgSlug,
  disabled = false,
  className = '',
}: BuyCourseButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePurchase = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          orgSlug,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className={className}>
      <Button
        onClick={handlePurchase}
        disabled={disabled || loading}
        size="lg"
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Processing...
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5 mr-2" />
            Buy for {formatCurrency(price, currency)}
          </>
        )}
      </Button>

      {error && (
        <p className="text-sm text-red-600 mt-2 text-center">
          {error}
        </p>
      )}

      <p className="text-xs text-muted-foreground text-center mt-2">
        Secure checkout powered by Stripe
      </p>
    </div>
  )
}
