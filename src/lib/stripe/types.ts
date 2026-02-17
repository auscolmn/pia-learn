import type Stripe from 'stripe'

// Checkout session types
export interface CreateCheckoutParams {
  courseId: string
  courseTitle: string
  coursePrice: number // in cents
  courseCurrency: string
  orgId: string
  orgName: string
  userId: string
  userEmail: string
  successUrl: string
  cancelUrl: string
  // For Stripe Connect - org receives the payment
  stripeAccountId?: string | null
  // Platform fee percentage (default 10%)
  platformFeePercent?: number
}

export interface CheckoutSessionResult {
  sessionId: string
  url: string
}

// Webhook event types we handle
export type WebhookEventType =
  | 'checkout.session.completed'
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.paid'
  | 'invoice.payment_failed'
  | 'account.updated'

// Checkout metadata we store in Stripe
export interface CheckoutMetadata {
  courseId: string
  orgId: string
  userId: string
  type: 'course_purchase'
}

// Stripe Connect types
export interface ConnectAccountStatus {
  accountId: string
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  requirements?: Stripe.Account.Requirements
}

export interface CreateConnectAccountParams {
  orgId: string
  orgName: string
  email: string
  country?: string
}

export interface ConnectOnboardingParams {
  accountId: string
  refreshUrl: string
  returnUrl: string
}

// Invoice line item (matches our DB schema)
export interface InvoiceLineItem {
  description: string
  quantity: number
  unit_price: number // in cents
  amount: number // in cents
}

// Usage summary for billing dashboard
export interface UsageSummary {
  activeStudents: number
  videoStorageGb: number
  videoBandwidthGb: number
  certificatesIssued: number
  estimatedAmount: number // in cents
}

// Pricing tiers
export interface PricingConfig {
  pricePerActiveStudent: number // cents
  pricePerGbStorage: number
  pricePerGbBandwidth: number
  pricePerCertificate: number
  priceCustomDomain: number
  freeStudentsLimit: number
  freeStorageGb: number
  freeBandwidthGb: number
}
