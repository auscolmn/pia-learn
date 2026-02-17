'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  PlayCircle, 
  FileText, 
  HelpCircle,
  CheckCircle2,
  Loader2,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { markLessonComplete, markLessonIncomplete } from '@/lib/enrollments/actions'
import { toast } from 'sonner'
import type { Lesson, LessonProgress } from '@/lib/supabase/types'
import ReactMarkdown from 'react-markdown'

interface LessonContentProps {
  lesson: Lesson
  enrollmentId: string
  progress: LessonProgress | undefined
  orgSlug: string
  courseSlug: string
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins < 60) {
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  return `${hours}:${remainingMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function LessonContent({
  lesson,
  enrollmentId,
  progress,
  orgSlug,
  courseSlug,
}: LessonContentProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isComplete = progress?.completed ?? false

  const handleToggleComplete = () => {
    startTransition(async () => {
      if (isComplete) {
        const result = await markLessonIncomplete(enrollmentId, lesson.id)
        if (!result.success) {
          toast.error(result.error || 'Failed to update progress')
        }
      } else {
        const result = await markLessonComplete(enrollmentId, lesson.id)
        if (result.success) {
          toast.success('Lesson marked as complete!')
        } else {
          toast.error(result.error || 'Failed to update progress')
        }
      }
      router.refresh()
    })
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Lesson Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          {lesson.type === 'video' && <PlayCircle className="h-4 w-4" />}
          {lesson.type === 'text' && <FileText className="h-4 w-4" />}
          {lesson.type === 'quiz' && <HelpCircle className="h-4 w-4" />}
          <span className="capitalize">{lesson.type} Lesson</span>
          {lesson.duration && (
            <>
              <span>•</span>
              <Clock className="h-4 w-4" />
              <span>{formatDuration(lesson.duration)}</span>
            </>
          )}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold">{lesson.title}</h1>
        {lesson.description && (
          <p className="text-muted-foreground mt-2">{lesson.description}</p>
        )}
      </div>

      {/* Video Content */}
      {lesson.type === 'video' && (
        <div className="mb-6">
          <VideoPlayer 
            videoUrl={lesson.video_url}
            videoProvider={lesson.video_provider}
            videoId={lesson.video_id}
          />
        </div>
      )}

      {/* Text Content */}
      {(lesson.type === 'text' || lesson.content) && lesson.content && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <ReactMarkdown>{lesson.content}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quiz Placeholder */}
      {lesson.type === 'quiz' && (
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Quiz Coming Soon</h3>
            <p className="text-muted-foreground">
              The quiz functionality will be available in a future update.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Mark Complete Section */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-3">
          <Checkbox 
            id="complete"
            checked={isComplete}
            onCheckedChange={handleToggleComplete}
            disabled={isPending}
          />
          <label 
            htmlFor="complete"
            className={cn(
              "text-sm font-medium cursor-pointer",
              isComplete && "text-green-600"
            )}
          >
            {isComplete ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Lesson Complete
              </span>
            ) : (
              'Mark as Complete'
            )}
          </label>
        </div>
        
        {isPending && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
    </div>
  )
}

// Video Player Component (placeholder for now)
function VideoPlayer({
  videoUrl,
  videoProvider,
  videoId,
}: {
  videoUrl: string | null
  videoProvider: string | null
  videoId: string | null
}) {
  if (!videoUrl && !videoId) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <PlayCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No video available</p>
        </div>
      </div>
    )
  }

  // YouTube embed
  if (videoProvider === 'youtube' && videoId) {
    return (
      <div className="aspect-video rounded-lg overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  // Vimeo embed
  if (videoProvider === 'vimeo' && videoId) {
    return (
      <div className="aspect-video rounded-lg overflow-hidden">
        <iframe
          src={`https://player.vimeo.com/video/${videoId}`}
          className="w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  // Mux video (placeholder - actual Mux player would be integrated separately)
  if (videoProvider === 'mux' && videoId) {
    return (
      <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
        <div className="text-center text-white">
          <PlayCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="opacity-70">Mux Video: {videoId}</p>
          <p className="text-sm opacity-50 mt-2">
            Video player integration pending
          </p>
        </div>
      </div>
    )
  }

  // Direct video URL
  if (videoUrl) {
    return (
      <div className="aspect-video rounded-lg overflow-hidden bg-black">
        <video
          src={videoUrl}
          controls
          className="w-full h-full"
          playsInline
        >
          Your browser does not support the video tag.
        </video>
      </div>
    )
  }

  return (
    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
      <div className="text-center">
        <PlayCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Video unavailable</p>
      </div>
    </div>
  )
}
