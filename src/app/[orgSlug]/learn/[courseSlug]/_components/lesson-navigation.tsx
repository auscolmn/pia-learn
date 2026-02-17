'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Lesson } from '@/lib/supabase/types'

interface LessonNavigationProps {
  orgSlug: string
  courseSlug: string
  prevLesson: { lesson: Lesson; moduleTitle: string } | null
  nextLesson: { lesson: Lesson; moduleTitle: string } | null
  isComplete: boolean
}

export function LessonNavigation({
  orgSlug,
  courseSlug,
  prevLesson,
  nextLesson,
  isComplete,
}: LessonNavigationProps) {
  return (
    <div className="p-4 md:p-6 lg:p-8 border-t mt-8">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Previous Lesson */}
        {prevLesson ? (
          <Button variant="outline" asChild className="flex-1 sm:flex-initial">
            <Link 
              href={`/${orgSlug}/learn/${courseSlug}?lesson=${prevLesson.lesson.id}`}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <div className="text-left">
                <div className="text-xs text-muted-foreground">Previous</div>
                <div className="text-sm font-medium truncate max-w-[200px]">
                  {prevLesson.lesson.title}
                </div>
              </div>
            </Link>
          </Button>
        ) : (
          <div />
        )}

        {/* Next Lesson */}
        {nextLesson ? (
          <Button 
            asChild 
            className="flex-1 sm:flex-initial"
            variant={isComplete ? 'default' : 'outline'}
          >
            <Link 
              href={`/${orgSlug}/learn/${courseSlug}?lesson=${nextLesson.lesson.id}`}
              className="flex items-center gap-2"
            >
              <div className="text-right">
                <div className="text-xs opacity-70">Next</div>
                <div className="text-sm font-medium truncate max-w-[200px]">
                  {nextLesson.lesson.title}
                </div>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button variant="default" asChild>
            <Link href={`/${orgSlug}/dashboard`}>
              Course Complete! View Dashboard
              <ChevronRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
