import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent, parseCheckoutCompleted, parseAccountUpdated } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    const event = constructWebhookEvent(body, signature)

    // Use service client for webhook operations (bypasses RLS)
    const supabase = createServiceClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const checkoutData = parseCheckoutCompleted(session)

        if (!checkoutData) {
          console.log('Checkout session without course_purchase metadata, skipping')
          break
        }

        const { metadata, amountPaid, currency, paymentIntentId } = checkoutData

        // Check if enrollment already exists
        const { data: existingEnrollment } = await supabase
          .from('enrollments')
          .select('id, status')
          .eq('user_id', metadata.userId)
          .eq('course_id', metadata.courseId)
          .single()

        if (existingEnrollment) {
          // Reactivate if cancelled/expired
          if (existingEnrollment.status === 'cancelled' || existingEnrollment.status === 'expired') {
            await supabase
              .from('enrollments')
              .update({
                status: 'active',
                stripe_payment_id: paymentIntentId,
                amount_paid: amountPaid / 100, // Convert from cents
                currency: currency.toUpperCase(),
                enrolled_at: new Date().toISOString(),
              })
              .eq('id', existingEnrollment.id)
          }
          // If active/completed, skip
        } else {
          // Create new enrollment
          const { error: enrollError } = await supabase
            .from('enrollments')
            .insert({
              org_id: metadata.orgId,
              user_id: metadata.userId,
              course_id: metadata.courseId,
              status: 'active',
              progress_percent: 0,
              stripe_payment_id: paymentIntentId,
              amount_paid: amountPaid / 100,
              currency: currency.toUpperCase(),
            })

          if (enrollError) {
            console.error('Failed to create enrollment:', enrollError)
            // Return 200 anyway to acknowledge the webhook
            // We can handle retries or alerts separately
          }
        }

        // Track active student
        await supabase.rpc('track_active_student', {
          p_org_id: metadata.orgId,
          p_user_id: metadata.userId,
        })

        console.log(`Enrollment created for user ${metadata.userId} in course ${metadata.courseId}`)
        break
      }

      case 'account.updated': {
        const account = event.data.object
        const accountData = parseAccountUpdated(account)

        if (accountData.orgId) {
          // Update org's Stripe onboarding status
          const isOnboarded = accountData.chargesEnabled && 
                              accountData.payoutsEnabled && 
                              accountData.detailsSubmitted

          await supabase
            .from('organizations')
            .update({
              stripe_onboarded: isOnboarded,
            })
            .eq('id', accountData.orgId)

          console.log(`Updated Stripe onboarding status for org ${accountData.orgId}: ${isOnboarded}`)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    )
  }
}
