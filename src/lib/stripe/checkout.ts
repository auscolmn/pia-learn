import { stripe } from './client'
import type { CreateCheckoutParams, CheckoutSessionResult, CheckoutMetadata } from './types'

const PLATFORM_FEE_PERCENT = 10 // 10% platform fee

/**
 * Create a Stripe Checkout session for course purchase
 */
export async function createCourseCheckout(
  params: CreateCheckoutParams
): Promise<CheckoutSessionResult> {
  const {
    courseId,
    courseTitle,
    coursePrice,
    courseCurrency,
    orgId,
    orgName,
    userId,
    userEmail,
    successUrl,
    cancelUrl,
    stripeAccountId,
    platformFeePercent = PLATFORM_FEE_PERCENT,
  } = params

  // Metadata to store with the session
  const metadata: CheckoutMetadata = {
    courseId,
    orgId,
    userId,
    type: 'course_purchase',
  }

  // Build checkout session params
  const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: userEmail,
    line_items: [
      {
        price_data: {
          currency: courseCurrency.toLowerCase(),
          product_data: {
            name: courseTitle,
            description: `Course enrollment at ${orgName}`,
          },
          unit_amount: coursePrice,
        },
        quantity: 1,
      },
    ],
    metadata,
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
  }

  // If org has Stripe Connect, use destination charges
  // Platform takes a fee, rest goes to the org
  if (stripeAccountId) {
    const applicationFee = Math.round(coursePrice * (platformFeePercent / 100))
    sessionParams.payment_intent_data = {
      application_fee_amount: applicationFee,
      transfer_data: {
        destination: stripeAccountId,
      },
    }
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  if (!session.url) {
    throw new Error('Failed to create checkout session URL')
  }

  return {
    sessionId: session.id,
    url: session.url,
  }
}

/**
 * Retrieve a checkout session by ID
 */
export async function getCheckoutSession(sessionId: string) {
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent', 'customer'],
  })
}

/**
 * Verify a checkout session completed successfully
 */
export async function verifyCheckoutSession(sessionId: string) {
  const session = await getCheckoutSession(sessionId)
  
  if (session.payment_status !== 'paid') {
    return {
      success: false,
      error: 'Payment not completed',
      session,
    }
  }

  const metadata = session.metadata as CheckoutMetadata | null
  if (!metadata || metadata.type !== 'course_purchase') {
    return {
      success: false,
      error: 'Invalid session metadata',
      session,
    }
  }

  return {
    success: true,
    session,
    metadata,
    paymentIntentId: typeof session.payment_intent === 'string' 
      ? session.payment_intent 
      : session.payment_intent?.id,
    amountPaid: session.amount_total,
    currency: session.currency,
  }
}
