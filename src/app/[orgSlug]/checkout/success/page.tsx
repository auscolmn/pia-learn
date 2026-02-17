import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'
import { createServerClient, getUser } from '@/lib/supabase/server'
import { verifyCheckoutSession } from '@/lib/stripe'
import type { Course, Organization } from '@/lib/supabase/types'

interface PageProps {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ session_id?: string }>
}

async function SuccessContent({ 
  orgSlug, 
  sessionId 
}: { 
  orgSlug: string
  sessionId?: string 
}) {
  if (!sessionId) {
    redirect(`/${orgSlug}`)
  }

  const user = await getUser()
  if (!user) {
    redirect(`/login?redirect=/${orgSlug}/checkout/success?session_id=${sessionId}`)
  }

  const supabase = await createServerClient()

  // Get org
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', orgSlug)
    .single()

  if (!org) {
    redirect('/')
  }

  const organization = org as Organization

  // Verify the checkout session
  const result = await verifyCheckoutSession(sessionId)

  if (!result.success) {
    return (
      <div className="text-center">
        <div className="rounded-full bg-red-100 p-4 w-fit mx-auto mb-6">
          <CheckCircle2 className="h-12 w-12 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Payment Issue</h1>
        <p className="text-muted-foreground mb-6">
          {result.error || 'There was an issue verifying your payment.'}
        </p>
        <Link
          href={`/${orgSlug}`}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90"
        >
          Back to Courses
        </Link>
      </div>
    )
  }

  // Get the course
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', result.metadata!.courseId)
    .single()

  const courseData = course as Course | null

  return (
    <div className="text-center">
      <div className="rounded-full bg-green-100 p-4 w-fit mx-auto mb-6">
        <CheckCircle2 className="h-12 w-12 text-green-600" />
      </div>
      
      <h1 className="text-3xl font-bold mb-4">
        You&apos;re Enrolled!
      </h1>
      
      <p className="text-lg text-muted-foreground mb-2">
        Thank you for your purchase.
      </p>
      
      {courseData && (
        <p className="text-muted-foreground mb-8">
          You now have full access to <strong>{courseData.title}</strong>
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {courseData && (
          <Link
            href={`/${orgSlug}/learn/${courseData.slug}`}
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Start Learning
            <ArrowRight className="h-5 w-5" />
          </Link>
        )}
        
        <Link
          href={`/${orgSlug}/dashboard`}
          className="inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-medium hover:bg-secondary/80 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>

      <div className="mt-12 pt-8 border-t">
        <p className="text-sm text-muted-foreground">
          A confirmation email has been sent to your email address.
        </p>
      </div>
    </div>
  )
}

export default async function CheckoutSuccessPage({ params, searchParams }: PageProps) {
  const { orgSlug } = await params
  const { session_id } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Suspense 
          fallback={
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Verifying your purchase...</p>
            </div>
          }
        >
          <SuccessContent orgSlug={orgSlug} sessionId={session_id} />
        </Suspense>
      </div>
    </div>
  )
}
