import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getQuizByLessonId, getQuizAttempts, startQuizAttempt } from '@/lib/quizzes/actions'
import { QuizTakingInterface } from './_components/quiz-taking-interface'
import type { Enrollment, Organization, Lesson } from '@/lib/supabase/types'

interface QuizPageProps {
  params: Promise<{
    orgSlug: string
    courseSlug: string
    lessonId: string
  }>
}

export async function generateMetadata({ params }: QuizPageProps): Promise<Metadata> {
  const { orgSlug, courseSlug, lessonId } = await params
  const supabase = await createServerClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('slug', orgSlug)
    .single()

  const { data: lesson } = await supabase
    .from('lessons')
    .select('title')
    .eq('id', lessonId)
    .single()

  return {
    title: lesson ? `Quiz: ${lesson.title} | ${org?.name ?? 'LearnStudio'}` : 'Quiz | LearnStudio',
  }
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { orgSlug, courseSlug, lessonId } = await params
  const supabase = await createServerClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?redirectTo=/${orgSlug}/learn/${courseSlug}/quiz/${lessonId}`)
  }

  // Get organization
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', orgSlug)
    .single()

  if (!org) {
    notFound()
  }

  // Get lesson with course info
  const { data: lesson } = await supabase
    .from('lessons')
    .select(`
      *,
      module:modules (
        course:courses (
          id,
          slug,
          title,
          org_id
        )
      )
    `)
    .eq('id', lessonId)
    .single()

  if (!lesson || lesson.type !== 'quiz') {
    notFound()
  }

  const course = (lesson.module as { course: { id: string; slug: string; title: string; org_id: string } }).course

  if (course.org_id !== org.id || course.slug !== courseSlug) {
    notFound()
  }

  // Get enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .in('status', ['active', 'completed'])
    .single()

  if (!enrollment) {
    redirect(`/${orgSlug}/courses/${courseSlug}`)
  }

  // Get quiz with questions
  const quizResult = await getQuizByLessonId(lessonId)
  if (!quizResult.success || !quizResult.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quiz Not Found</h1>
          <p className="text-gray-600">This quiz hasn&apos;t been set up yet.</p>
        </div>
      </div>
    )
  }

  const quiz = quizResult.data

  // Get previous attempts
  const attemptsResult = await getQuizAttempts(quiz.id, enrollment.id)
  const previousAttempts = attemptsResult.success ? attemptsResult.data ?? [] : []

  // Check if max attempts exceeded
  const attemptsRemaining = quiz.max_attempts 
    ? Math.max(0, quiz.max_attempts - previousAttempts.length)
    : null

  // Start or resume attempt
  let currentAttempt = null
  if (attemptsRemaining === null || attemptsRemaining > 0) {
    const attemptResult = await startQuizAttempt(quiz.id, enrollment.id)
    if (attemptResult.success) {
      currentAttempt = attemptResult.data
    }
  }

  return (
    <QuizTakingInterface
      org={org as Organization}
      orgSlug={orgSlug}
      courseSlug={courseSlug}
      courseTitle={course.title}
      lesson={lesson as Lesson}
      quiz={quiz}
      enrollment={enrollment as Enrollment}
      currentAttempt={currentAttempt ?? undefined}
      previousAttempts={previousAttempts}
      attemptsRemaining={attemptsRemaining}
    />
  )
}
