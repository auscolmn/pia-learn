'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { 
  Enrollment, 
  EnrollmentWithCourse, 
  LessonProgress,
  Certificate,
  CertificateWithCourse,
  Course,
  CourseWithModules,
  ModuleWithLessons,
  Module,
  Lesson
} from '@/lib/supabase/types'

// ============================================
// ACTION RESULT TYPE
// ============================================

export interface ActionResult<T = void> {
  success: boolean
  error?: string
  data?: T
}

// ============================================
// ENROLLMENT ACTIONS
// ============================================

export async function enrollInCourse(
  orgId: string,
  courseId: string
): Promise<ActionResult<Enrollment>> {
  const supabase = await createServerClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'You must be logged in to enroll' }
  }

  // Check if course exists and is published
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, price, status')
    .eq('id', courseId)
    .eq('org_id', orgId)
    .single()

  if (courseError || !course) {
    return { success: false, error: 'Course not found' }
  }

  if (course.status !== 'published') {
    return { success: false, error: 'This course is not available for enrollment' }
  }

  // Check if already enrolled
  const { data: existingEnrollment } = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (existingEnrollment) {
    if (existingEnrollment.status === 'active' || existingEnrollment.status === 'completed') {
      return { success: false, error: 'You are already enrolled in this course' }
    }
    // Reactivate cancelled/expired enrollment
    const { data: reactivated, error: reactivateError } = await supabase
      .from('enrollments')
      .update({ status: 'active', enrolled_at: new Date().toISOString() })
      .eq('id', existingEnrollment.id)
      .select()
      .single()

    if (reactivateError) {
      return { success: false, error: reactivateError.message }
    }
    revalidatePath('/[orgSlug]/courses/[slug]', 'page')
    revalidatePath('/[orgSlug]/dashboard', 'page')
    return { success: true, data: reactivated as Enrollment }
  }

  // For paid courses, we would redirect to Stripe - for now, only allow free
  if (course.price > 0) {
    return { success: false, error: 'Paid course enrollment not yet implemented' }
  }

  // Create enrollment for free course
  const { data: enrollment, error: enrollError } = await supabase
    .from('enrollments')
    .insert({
      org_id: orgId,
      user_id: user.id,
      course_id: courseId,
      status: 'active',
      progress_percent: 0,
      amount_paid: 0,
      currency: 'AUD',
    })
    .select()
    .single()

  if (enrollError) {
    return { success: false, error: enrollError.message }
  }

  revalidatePath('/[orgSlug]/courses/[slug]', 'page')
  revalidatePath('/[orgSlug]/dashboard', 'page')
  return { success: true, data: enrollment as Enrollment }
}

export async function getEnrollment(
  courseId: string
): Promise<ActionResult<Enrollment | null>> {
  const supabase = await createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: true, data: null }
  }

  const { data, error } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    return { success: false, error: error.message }
  }

  return { success: true, data: (data as Enrollment) ?? null }
}

export async function getUserEnrollments(
  orgId: string
): Promise<ActionResult<EnrollmentWithCourse[]>> {
  const supabase = await createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      course:courses(*)
    `)
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .in('status', ['active', 'completed'])
    .order('enrolled_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return { 
    success: true, 
    data: (data as EnrollmentWithCourse[]).filter(e => e.course !== null)
  }
}

// ============================================
// PROGRESS TRACKING
// ============================================

export async function markLessonComplete(
  enrollmentId: string,
  lessonId: string
): Promise<ActionResult<LessonProgress>> {
  const supabase = await createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify enrollment belongs to user
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, user_id')
    .eq('id', enrollmentId)
    .eq('user_id', user.id)
    .single()

  if (!enrollment) {
    return { success: false, error: 'Enrollment not found' }
  }

  // Upsert lesson progress
  const { data: progress, error } = await supabase
    .from('lesson_progress')
    .upsert({
      enrollment_id: enrollmentId,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
    }, {
      onConflict: 'enrollment_id,lesson_id',
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // The trigger will auto-update enrollment progress_percent
  revalidatePath('/[orgSlug]/learn/[courseSlug]', 'page')
  revalidatePath('/[orgSlug]/dashboard', 'page')
  return { success: true, data: progress as LessonProgress }
}

export async function markLessonIncomplete(
  enrollmentId: string,
  lessonId: string
): Promise<ActionResult> {
  const supabase = await createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify enrollment belongs to user
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, user_id')
    .eq('id', enrollmentId)
    .eq('user_id', user.id)
    .single()

  if (!enrollment) {
    return { success: false, error: 'Enrollment not found' }
  }

  const { error } = await supabase
    .from('lesson_progress')
    .update({ completed: false, completed_at: null })
    .eq('enrollment_id', enrollmentId)
    .eq('lesson_id', lessonId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/[orgSlug]/learn/[courseSlug]', 'page')
  revalidatePath('/[orgSlug]/dashboard', 'page')
  return { success: true }
}

export async function updateWatchProgress(
  enrollmentId: string,
  lessonId: string,
  watchTime: number,
  lastPosition: number
): Promise<ActionResult> {
  const supabase = await createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('lesson_progress')
    .upsert({
      enrollment_id: enrollmentId,
      lesson_id: lessonId,
      watch_time: watchTime,
      last_position: lastPosition,
    }, {
      onConflict: 'enrollment_id,lesson_id',
    })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getLessonProgress(
  enrollmentId: string
): Promise<ActionResult<LessonProgress[]>> {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('enrollment_id', enrollmentId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: data as LessonProgress[] }
}

// ============================================
// CERTIFICATES
// ============================================

export async function getUserCertificates(
  orgId: string
): Promise<ActionResult<CertificateWithCourse[]>> {
  const supabase = await createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('certificates')
    .select(`
      *,
      course:courses(*)
    `)
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return { 
    success: true, 
    data: (data as CertificateWithCourse[]).filter(c => c.course !== null)
  }
}

// ============================================
// COURSE WITH PROGRESS DATA
// ============================================

export async function getCourseForLearning(
  orgSlug: string,
  courseSlug: string
): Promise<ActionResult<{
  course: CourseWithModules
  enrollment: Enrollment
  lessonProgress: LessonProgress[]
  currentLessonId: string | null
}>> {
  const supabase = await createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get org
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single()

  if (!org) {
    return { success: false, error: 'Organization not found' }
  }

  // Get course with modules and lessons
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('org_id', org.id)
    .eq('slug', courseSlug)
    .single()

  if (courseError || !course) {
    return { success: false, error: 'Course not found' }
  }

  // Get enrollment
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .in('status', ['active', 'completed'])
    .single()

  if (enrollmentError || !enrollment) {
    return { success: false, error: 'You are not enrolled in this course' }
  }

  // Get modules with lessons
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select(`
      *,
      lessons (*)
    `)
    .eq('course_id', course.id)
    .order('sort_order', { ascending: true })

  if (modulesError) {
    return { success: false, error: modulesError.message }
  }

  // Sort lessons within each module
  const modulesWithSortedLessons = (modules as (Module & { lessons: Lesson[] })[]).map(m => ({
    ...m,
    lessons: m.lessons.sort((a, b) => a.sort_order - b.sort_order)
  })) as ModuleWithLessons[]

  // Get lesson progress
  const { data: lessonProgress } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('enrollment_id', enrollment.id)

  const progressData = (lessonProgress ?? []) as LessonProgress[]

  // Find current lesson (first incomplete, or last if all complete)
  const completedLessonIds = new Set(
    progressData.filter(p => p.completed).map(p => p.lesson_id)
  )

  let currentLessonId: string | null = null
  for (const mod of modulesWithSortedLessons) {
    for (const lesson of mod.lessons) {
      if (!completedLessonIds.has(lesson.id)) {
        currentLessonId = lesson.id
        break
      }
    }
    if (currentLessonId) break
  }

  // If all complete, use the last lesson
  if (!currentLessonId && modulesWithSortedLessons.length > 0) {
    const lastModule = modulesWithSortedLessons[modulesWithSortedLessons.length - 1]
    if (lastModule.lessons.length > 0) {
      currentLessonId = lastModule.lessons[lastModule.lessons.length - 1].id
    }
  }

  return {
    success: true,
    data: {
      course: {
        ...course,
        modules: modulesWithSortedLessons,
      } as CourseWithModules,
      enrollment: enrollment as Enrollment,
      lessonProgress: progressData,
      currentLessonId,
    }
  }
}
