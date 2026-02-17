import Stripe from 'stripe'
import { getStripe } from './client'
import type { CheckoutMetadata } from './types'

/**
 * Verify and construct a Stripe webhook event
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set')
  }

  return getStripe().webhooks.constructEvent(payload, signature, webhookSecret)
}

/**
 * Extract checkout metadata from a completed session
 */
export function extractCheckoutMetadata(
  session: Stripe.Checkout.Session
): CheckoutMetadata | null {
  const metadata = session.metadata
  if (!metadata || metadata.type !== 'course_purchase') {
    return null
  }

  return {
    courseId: metadata.courseId,
    orgId: metadata.orgId,
    userId: metadata.userId,
    type: 'course_purchase',
  }
}

/**
 * Handle checkout.session.completed event
 */
export interface CheckoutCompletedData {
  sessionId: string
  paymentIntentId: string | null
  metadata: CheckoutMetadata
  amountPaid: number
  currency: string
  customerEmail: string | null
}

export function parseCheckoutCompleted(
  session: Stripe.Checkout.Session
): CheckoutCompletedData | null {
  const metadata = extractCheckoutMetadata(session)
  if (!metadata) {
    return null
  }

  return {
    sessionId: session.id,
    paymentIntentId: typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null,
    metadata,
    amountPaid: session.amount_total ?? 0,
    currency: session.currency ?? 'usd',
    customerEmail: session.customer_email,
  }
}

/**
 * Handle account.updated event for Connect
 */
export interface AccountUpdatedData {
  accountId: string
  orgId: string | null
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
}

export function parseAccountUpdated(
  account: Stripe.Account
): AccountUpdatedData {
  return {
    accountId: account.id,
    orgId: account.metadata?.orgId ?? null,
    chargesEnabled: account.charges_enabled ?? false,
    payoutsEnabled: account.payouts_enabled ?? false,
    detailsSubmitted: account.details_submitted ?? false,
  }
}
