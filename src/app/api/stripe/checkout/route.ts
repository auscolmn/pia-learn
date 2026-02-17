import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createCourseCheckout } from '@/lib/stripe'
import type { Course, Organization } from '@/lib/supabase/types'

interface CheckoutRequestBody {
  courseId: string
  orgSlug: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckoutRequestBody
    const { courseId, orgSlug } = body

    if (!courseId || !orgSlug) {
      return NextResponse.json(
        { error: 'Missing courseId or orgSlug' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !user.email) {
      return NextResponse.json(
        { error: 'You must be logged in to purchase a course' },
        { status: 401 }
      )
    }

    // Get org
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', orgSlug)
      .single()

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    const organization = org as Organization

    // Get course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('org_id', organization.id)
      .eq('status', 'published')
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found or not available' },
        { status: 404 }
      )
    }

    const courseData = course as Course

    if (courseData.price <= 0) {
      return NextResponse.json(
        { error: 'This is a free course. Use the enroll endpoint instead.' },
        { status: 400 }
      )
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single()

    if (existingEnrollment && 
        (existingEnrollment.status === 'active' || existingEnrollment.status === 'completed')) {
      return NextResponse.json(
        { error: 'You are already enrolled in this course' },
        { status: 400 }
      )
    }

    // Build URLs
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || ''
    const successUrl = `${origin}/${orgSlug}/checkout/success`
    const cancelUrl = `${origin}/${orgSlug}/courses/${courseData.slug}`

    // Create Stripe checkout session
    const { sessionId, url } = await createCourseCheckout({
      courseId: courseData.id,
      courseTitle: courseData.title,
      coursePrice: Math.round(courseData.price * 100), // Convert to cents
      courseCurrency: courseData.currency,
      orgId: organization.id,
      orgName: organization.name,
      userId: user.id,
      userEmail: user.email,
      successUrl,
      cancelUrl,
      stripeAccountId: organization.stripe_account_id,
    })

    return NextResponse.json({ sessionId, url })

  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
