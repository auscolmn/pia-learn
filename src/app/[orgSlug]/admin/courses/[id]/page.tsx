import { notFound } from 'next/navigation'
import { getOrgBySlugOrDomain } from '@/lib/supabase/server'
import { getCourseWithModules } from '@/lib/courses/actions'
import { CourseEditor } from './_components/course-editor'
import Link from 'next/link'
import { ArrowLeft, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface CoursePageProps {
  params: Promise<{ orgSlug: string; id: string }>
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { orgSlug, id } = await params
  
  const org = await getOrgBySlugOrDomain(orgSlug)
  if (!org) return notFound()

  const result = await getCourseWithModules(id)
  if (!result.success || !result.data) {
    return notFound()
  }

  const course = result.data

  // Verify course belongs to this org
  if (course.org_id !== org.id) {
    return notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/${orgSlug}/admin/courses`}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to courses</span>
          </Link>
          <div className="h-6 w-px bg-gray-300 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{course.title}</h1>
              <Badge 
                variant={course.status === 'published' ? 'default' : 'secondary'}
                className={course.status === 'published' 
                  ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                  : ''
                }
              >
                {course.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">/{course.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${orgSlug}/courses/${course.slug}`} target="_blank">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Link>
          </Button>
        </div>
      </div>

      {/* Editor */}
      <CourseEditor course={course} orgSlug={orgSlug} />
    </div>
  )
}
