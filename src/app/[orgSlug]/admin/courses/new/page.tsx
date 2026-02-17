import { getOrgBySlugOrDomain } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateCourseForm } from './_components/create-course-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface NewCoursePageProps {
  params: Promise<{ orgSlug: string }>
}

export default async function NewCoursePage({ params }: NewCoursePageProps) {
  const { orgSlug } = await params
  
  const org = await getOrgBySlugOrDomain(orgSlug)
  if (!org) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href={`/${orgSlug}/admin/courses`}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to courses
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create a New Course</CardTitle>
          <CardDescription>
            Start by entering the basic information for your course. You can add modules and lessons after creating it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateCourseForm orgId={org.id} orgSlug={orgSlug} />
        </CardContent>
      </Card>
    </div>
  )
}
