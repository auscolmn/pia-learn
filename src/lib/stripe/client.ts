import Stripe from 'stripe'

let _stripe: Stripe | null = null

/**
 * Get the Stripe client instance (lazy initialized)
 */
export function getStripe(): Stripe {
  if (_stripe) return _stripe

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }

  _stripe = new Stripe(secretKey, {
    apiVersion: '2026-01-28.clover',
    typescript: true,
  })

  return _stripe
}

// Alias for convenience
export { getStripe as stripe }

// Publishable key for client-side usage
export const getPublishableKey = () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!key) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
  }
  return key
}
