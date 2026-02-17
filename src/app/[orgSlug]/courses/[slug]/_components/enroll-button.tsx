'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, ChevronRight } from 'lucide-react'
import { enrollInCourse } from '@/lib/enrollments/actions'
import { toast } from 'sonner'

interface EnrollButtonProps {
  orgId: string
  orgSlug: string
  courseId: string
  courseSlug: string
  price: number
  isLoggedIn: boolean
}

export function EnrollButton({ 
  orgId, 
  orgSlug, 
  courseId, 
  courseSlug, 
  price, 
  isLoggedIn 
}: EnrollButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleEnroll = () => {
    if (!isLoggedIn) {
      // Redirect to login with return URL
      const returnUrl = `/${orgSlug}/courses/${courseSlug}`
      router.push(`/login?returnTo=${encodeURIComponent(returnUrl)}`)
      return
    }

    if (price > 0) {
      toast.error('Paid course enrollment coming soon!')
      return
    }

    startTransition(async () => {
      const result = await enrollInCourse(orgId, courseId)
      
      if (result.success) {
        toast.success('Successfully enrolled!')
        router.push(`/${orgSlug}/learn/${courseSlug}`)
      } else {
        toast.error(result.error || 'Failed to enroll')
      }
    })
  }

  return (
    <Button 
      className="w-full" 
      size="lg" 
      onClick={handleEnroll}
      disabled={isPending}
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Enrolling...
        </>
      ) : (
        <>
          {isLoggedIn ? 'Enroll Now' : 'Sign in to Enroll'}
          <ChevronRight className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  )
}
