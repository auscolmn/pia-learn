'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { updateCourse, deleteCourse } from '@/lib/courses/actions'
import { 
  Loader2, 
  Globe, 
  Eye, 
  EyeOff, 
  Star, 
  Trash2,
  AlertTriangle,
  Archive,
} from 'lucide-react'
import type { Course, CourseStatus } from '@/lib/supabase/types'
import { DeleteConfirmDialog } from './delete-confirm-dialog'

interface CourseSettingsProps {
  course: Course
}

export function CourseSettings({ course }: CourseSettingsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  const [isFeatured, setIsFeatured] = useState(course.is_featured)

  const handleStatusChange = (newStatus: CourseStatus) => {
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const result = await updateCourse({
        id: course.id,
        status: newStatus,
      })

      if (!result.success) {
        setError(result.error ?? 'Failed to update course status')
        return
      }

      const messages: Record<CourseStatus, string> = {
        published: 'Course published successfully!',
        draft: 'Course unpublished and saved as draft.',
        archived: 'Course archived.',
      }
      setSuccess(messages[newStatus])
      router.refresh()
      
      setTimeout(() => setSuccess(null), 3000)
    })
  }

  const handleFeaturedChange = (featured: boolean) => {
    setIsFeatured(featured)
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const result = await updateCourse({
        id: course.id,
        isFeatured: featured,
      })

      if (!result.success) {
        setIsFeatured(!featured) // Revert on error
        setError(result.error ?? 'Failed to update course')
        return
      }

      setSuccess(featured ? 'Course marked as featured' : 'Course removed from featured')
      router.refresh()
      
      setTimeout(() => setSuccess(null), 3000)
    })
  }

  const handleDelete = async () => {
    const result = await deleteCourse(course.id)
    
    if (!result.success) {
      setError(result.error ?? 'Failed to delete course')
      setDeleteDialogOpen(false)
      return
    }

    // Navigate back to courses list
    router.push(`/${extractOrgSlug()}/admin/courses`)
    router.refresh()
  }

  // Extract org slug from current URL (hacky but works)
  const extractOrgSlug = () => {
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/')
      return pathParts[1] ?? ''
    }
    return ''
  }

  const isPublished = course.status === 'published'
  const isDraft = course.status === 'draft'
  const isArchived = course.status === 'archived'

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Publication Status */}
      <Card>
        <CardHeader>
          <CardTitle>Publication Status</CardTitle>
          <CardDescription>Control whether this course is visible to students</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {isPublished ? (
                <Globe className="h-5 w-5 text-green-600" />
              ) : isDraft ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Archive className="h-5 w-5 text-orange-500" />
              )}
              <div>
                <p className="font-medium text-gray-900">
                  {isPublished ? 'Published' : isDraft ? 'Draft' : 'Archived'}
                </p>
                <p className="text-sm text-gray-500">
                  {isPublished 
                    ? 'This course is visible to students'
                    : isDraft
                    ? 'This course is hidden from students'
                    : 'This course is archived and hidden'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isPublished ? (
                <Button 
                  variant="outline" 
                  onClick={() => handleStatusChange('draft')}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <EyeOff className="mr-2 h-4 w-4" />}
                  Unpublish
                </Button>
              ) : (
                <Button 
                  onClick={() => handleStatusChange('published')}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
                  Publish
                </Button>
              )}
            </div>
          </div>

          {course.published_at && (
            <p className="text-sm text-gray-500">
              Last published: {new Date(course.published_at).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Visibility Options */}
      <Card>
        <CardHeader>
          <CardTitle>Visibility Options</CardTitle>
          <CardDescription>Control how this course appears in your catalog</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className={isFeatured ? "h-5 w-5 text-yellow-500" : "h-5 w-5 text-gray-400"} />
              <div>
                <Label htmlFor="featured" className="font-medium">Featured Course</Label>
                <p className="text-sm text-gray-500">
                  Show this course prominently on your landing page
                </p>
              </div>
            </div>
            <Switch
              id="featured"
              checked={isFeatured}
              onCheckedChange={handleFeaturedChange}
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Archive */}
      {!isArchived && (
        <Card>
          <CardHeader>
            <CardTitle>Archive Course</CardTitle>
            <CardDescription>
              Archive this course to hide it from students while preserving the content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline"
              onClick={() => handleStatusChange('archived')}
              disabled={isPending}
            >
              <Archive className="mr-2 h-4 w-4" />
              Archive Course
            </Button>
          </CardContent>
        </Card>
      )}

      {isArchived && (
        <Card>
          <CardHeader>
            <CardTitle>Restore Course</CardTitle>
            <CardDescription>
              Restore this course from archive
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => handleStatusChange('draft')}
              disabled={isPending}
            >
              Restore as Draft
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that will permanently affect your course
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
            <div>
              <p className="font-medium text-gray-900">Delete Course</p>
              <p className="text-sm text-gray-600">
                Permanently delete this course and all its content
              </p>
            </div>
            <Button 
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Course"
        description={`Are you sure you want to delete "${course.title}"? This action cannot be undone and will permanently delete all modules, lessons, and student progress.`}
        onConfirm={handleDelete}
      />
    </div>
  )
}
