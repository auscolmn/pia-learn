import { notFound, redirect } from "next/navigation"
import { getOrgBySlugOrDomain, getUser } from "@/lib/supabase/server"
import { getCourseForLearning } from "@/lib/enrollments/actions"
import { LearningInterface } from "./_components/learning-interface"

interface LearnPageProps {
  params: Promise<{ orgSlug: string; courseSlug: string }>
  searchParams: Promise<{ lesson?: string }>
}

export default async function LearnPage({ params, searchParams }: LearnPageProps) {
  const { orgSlug, courseSlug } = await params
  const { lesson: lessonIdParam } = await searchParams

  // Fetch organization
  const org = await getOrgBySlugOrDomain(orgSlug)
  if (!org) notFound()

  // Check authentication
  const user = await getUser()
  if (!user) {
    redirect(`/login?returnTo=/${orgSlug}/learn/${courseSlug}`)
  }

  // Get course data with enrollment and progress
  const result = await getCourseForLearning(orgSlug, courseSlug)
  
  if (!result.success || !result.data) {
    // Not enrolled or course not found
    redirect(`/${orgSlug}/courses/${courseSlug}`)
  }

  const { course, enrollment, lessonProgress, currentLessonId } = result.data

  // Determine which lesson to show
  const selectedLessonId = lessonIdParam || currentLessonId

  // Find the selected lesson
  let selectedLesson = null
  let selectedModuleIndex = 0
  let selectedLessonIndex = 0

  for (let mi = 0; mi < course.modules.length; mi++) {
    const module = course.modules[mi]
    for (let li = 0; li < module.lessons.length; li++) {
      const lesson = module.lessons[li]
      if (lesson.id === selectedLessonId) {
        selectedLesson = lesson
        selectedModuleIndex = mi
        selectedLessonIndex = li
        break
      }
    }
    if (selectedLesson) break
  }

  // If no valid lesson found, use the first lesson
  if (!selectedLesson && course.modules.length > 0 && course.modules[0].lessons.length > 0) {
    selectedLesson = course.modules[0].lessons[0]
    selectedModuleIndex = 0
    selectedLessonIndex = 0
  }

  // Build progress map
  const progressMap = new Map(
    lessonProgress.map(p => [p.lesson_id, p])
  )

  // Calculate navigation
  const allLessons = course.modules.flatMap(m => 
    m.lessons.map(l => ({ lesson: l, moduleTitle: m.title }))
  )
  const currentIndex = allLessons.findIndex(l => l.lesson.id === selectedLessonId)
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  return (
    <LearningInterface
      org={org}
      orgSlug={orgSlug}
      course={course}
      enrollment={enrollment}
      selectedLesson={selectedLesson}
      selectedModuleIndex={selectedModuleIndex}
      progressMap={Object.fromEntries(progressMap)}
      prevLesson={prevLesson}
      nextLesson={nextLesson}
      user={user}
    />
  )
}
