'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { createLesson, updateLesson } from '@/lib/courses/actions'
import { Loader2, Video, FileText, HelpCircle, Clock } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { VideoUploader } from '@/components/video'
import type { Lesson, LessonType } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

interface LessonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  moduleId: string | null
  lesson: Lesson | null
  orgId: string
  onSuccess: () => void
}

const lessonTypeOptions: { value: LessonType; label: string; icon: typeof Video }[] = [
  { value: 'video', label: 'Video', icon: Video },
  { value: 'text', label: 'Text', icon: FileText },
  { value: 'quiz', label: 'Quiz', icon: HelpCircle },
]

export function LessonDialog({ 
  open, 
  onOpenChange, 
  moduleId, 
  lesson,
  orgId,
  onSuccess 
}: LessonDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  const [title, setTitle] = useState('')
  const [type, setType] = useState<LessonType>('video')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [videoPath, setVideoPath] = useState<string | null>(null)
  const [duration, setDuration] = useState('')
  const [isPreview, setIsPreview] = useState(false)
  const [isRequired, setIsRequired] = useState(true)

  const isEditing = !!lesson

  // Reset form when dialog opens/closes or lesson changes
  useEffect(() => {
    if (open) {
      setTitle(lesson?.title ?? '')
      setType(lesson?.type ?? 'video')
      setDescription(lesson?.description ?? '')
      setContent(lesson?.content ?? '')
      setVideoUrl(lesson?.video_url ?? '')
      setVideoPath(lesson?.video_id ?? null) // video_id stores the path for supabase
      setDuration(lesson?.duration?.toString() ?? '')
      setIsPreview(lesson?.is_preview ?? false)
      setIsRequired(lesson?.is_required ?? true)
      setError(null)
    }
  }, [open, lesson])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Lesson title is required')
      return
    }

    if (!moduleId && !isEditing) {
      setError('Module ID is required')
      return
    }

    startTransition(async () => {
      let result
      
      if (isEditing && lesson) {
        result = await updateLesson({
          id: lesson.id,
          title: title.trim(),
          type,
          description: description.trim() || undefined,
          content: content.trim() || undefined,
          videoUrl: videoUrl.trim() || undefined,
          duration: duration ? parseInt(duration) : undefined,
          isPreview,
          isRequired,
        })
      } else if (moduleId) {
        result = await createLesson({
          moduleId,
          title: title.trim(),
          type,
          description: description.trim() || undefined,
          content: content.trim() || undefined,
          videoUrl: videoUrl.trim() || undefined,
          duration: duration ? parseInt(duration) : undefined,
          isPreview,
          isRequired,
        })
      } else {
        setError('Module ID is required')
        return
      }

      if (!result.success) {
        setError(result.error ?? 'Failed to save lesson')
        return
      }

      onSuccess()
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Lesson' : 'Add Lesson'}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Update the lesson details.' 
                : 'Create a new lesson for this module.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="lessonTitle">Lesson Title *</Label>
              <Input
                id="lessonTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Introduction to the Course"
                disabled={isPending}
                autoFocus
              />
            </div>

            {/* Type Selector */}
            <div className="space-y-2">
              <Label>Lesson Type</Label>
              <div className="grid grid-cols-3 gap-3">
                {lessonTypeOptions.map((lt) => {
                  const Icon = lt.icon
                  const isSelected = type === lt.value
                  return (
                    <button
                      key={lt.value}
                      type="button"
                      onClick={() => setType(lt.value)}
                      disabled={isPending}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                        isSelected 
                          ? "border-green-600 bg-green-50" 
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <Icon className={cn(
                        "h-6 w-6",
                        isSelected ? "text-green-600" : "text-gray-400"
                      )} />
                      <span className={cn(
                        "text-sm font-medium",
                        isSelected ? "text-green-700" : "text-gray-700"
                      )}>
                        {lt.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="lessonDescription">Description (optional)</Label>
              <Textarea
                id="lessonDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this lesson..."
                rows={2}
                disabled={isPending}
              />
            </div>

            {/* Type-specific fields */}
            {type === 'video' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                {isEditing && lesson ? (
                  // Show uploader for existing lessons
                  <>
                    <Label>Video</Label>
                    <VideoUploader
                      orgId={orgId}
                      lessonId={lesson.id}
                      currentVideoUrl={videoUrl || undefined}
                      currentVideoPath={videoPath}
                      onUploadComplete={(url, dur) => {
                        setVideoUrl(url)
                        if (dur) setDuration(dur.toString())
                      }}
                      onDelete={() => {
                        setVideoUrl('')
                        setVideoPath(null)
                        setDuration('')
                      }}
                      disabled={isPending}
                    />
                  </>
                ) : (
                  // For new lessons, show message to create first
                  <div className="text-center py-4 text-sm text-gray-500">
                    <Video className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>Save the lesson first, then you can upload a video.</p>
                  </div>
                )}
                
                {duration && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                    <Clock className="h-4 w-4" />
                    <span>Duration: {formatDuration(parseInt(duration))}</span>
                  </div>
                )}
              </div>
            )}

            {type === 'text' && (
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write or paste your lesson content here (Markdown supported)..."
                  rows={6}
                  disabled={isPending}
                />
              </div>
            )}

            {type === 'quiz' && (
              <div className="p-4 bg-orange-50 rounded-lg text-center">
                <HelpCircle className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                <p className="text-sm text-orange-700">
                  {isEditing 
                    ? 'Save changes and then use the Quiz Builder to manage questions.'
                    : 'Save the lesson first, then you can configure quiz questions.'}
                </p>
              </div>
            )}

            {/* Settings */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isPreview">Free Preview</Label>
                  <p className="text-xs text-gray-500">
                    Allow non-enrolled users to view this lesson
                  </p>
                </div>
                <Switch
                  id="isPreview"
                  checked={isPreview}
                  onCheckedChange={setIsPreview}
                  disabled={isPending}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isRequired">Required for Completion</Label>
                  <p className="text-xs text-gray-500">
                    Students must complete this lesson to finish the course
                  </p>
                </div>
                <Switch
                  id="isRequired"
                  checked={isRequired}
                  onCheckedChange={setIsRequired}
                  disabled={isPending}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Add Lesson'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Helper to format duration in seconds to human readable
function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}
