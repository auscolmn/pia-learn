'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Course, Module, Lesson, CourseStatus, LessonType, CourseWithModules, ModuleWithLessons } from '@/lib/supabase/types'

// ============================================
// ACTION RESULT TYPE
// ============================================

export interface ActionResult<T = void> {
  success: boolean
  error?: string
  data?: T
}

// ============================================
// COURSE ACTIONS
// ============================================

export interface CreateCourseInput {
  orgId: string
  title: string
  slug: string
  description?: string
  shortDescription?: string
  price?: number
  currency?: string
  instructorId?: string
}

export async function createCourse(input: CreateCourseInput): Promise<ActionResult<Course>> {
  const supabase = await createServerClient()
  
  // Validate slug format
  const slugRegex = /^[a-z0-9-]+$/
  if (!slugRegex.test(input.slug)) {
    return { 
      success: false, 
      error: 'Slug can only contain lowercase letters, numbers, and hyphens' 
    }
  }

  const { data, error } = await supabase
    .from('courses')
    .insert({
      org_id: input.orgId,
      title: input.title,
      slug: input.slug,
      description: input.description ?? null,
      short_description: input.shortDescription ?? null,
      price: input.price ?? 0,
      currency: input.currency ?? 'AUD',
      instructor_id: input.instructorId ?? null,
      status: 'draft' as CourseStatus,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'A course with this URL already exists' }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/[orgSlug]/admin/courses', 'page')
  return { success: true, data: data as Course }
}

export interface UpdateCourseInput {
  id: string
  title?: string
  slug?: string
  description?: string
  shortDescription?: string
  thumbnailUrl?: string
  coverImageUrl?: string
  price?: number
  currency?: string
  status?: CourseStatus
  isFeatured?: boolean
  estimatedDuration?: number
  difficultyLevel?: string
  requirements?: string[]
  learningOutcomes?: string[]
  tags?: string[]
  instructorId?: string
}

export async function updateCourse(input: UpdateCourseInput): Promise<ActionResult<Course>> {
  const supabase = await createServerClient()

  // Validate slug if provided
  if (input.slug) {
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(input.slug)) {
      return { 
        success: false, 
        error: 'Slug can only contain lowercase letters, numbers, and hyphens' 
      }
    }
  }

  const updateData: Record<string, unknown> = {}
  
  if (input.title !== undefined) updateData.title = input.title
  if (input.slug !== undefined) updateData.slug = input.slug
  if (input.description !== undefined) updateData.description = input.description
  if (input.shortDescription !== undefined) updateData.short_description = input.shortDescription
  if (input.thumbnailUrl !== undefined) updateData.thumbnail_url = input.thumbnailUrl
  if (input.coverImageUrl !== undefined) updateData.cover_image_url = input.coverImageUrl
  if (input.price !== undefined) updateData.price = input.price
  if (input.currency !== undefined) updateData.currency = input.currency
  if (input.status !== undefined) {
    updateData.status = input.status
    if (input.status === 'published') {
      updateData.published_at = new Date().toISOString()
    }
  }
  if (input.isFeatured !== undefined) updateData.is_featured = input.isFeatured
  if (input.estimatedDuration !== undefined) updateData.estimated_duration = input.estimatedDuration
  if (input.difficultyLevel !== undefined) updateData.difficulty_level = input.difficultyLevel
  if (input.requirements !== undefined) updateData.requirements = input.requirements
  if (input.learningOutcomes !== undefined) updateData.learning_outcomes = input.learningOutcomes
  if (input.tags !== undefined) updateData.tags = input.tags
  if (input.instructorId !== undefined) updateData.instructor_id = input.instructorId

  const { data, error } = await supabase
    .from('courses')
    .update(updateData)
    .eq('id', input.id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'A course with this URL already exists' }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/[orgSlug]/admin/courses', 'page')
  revalidatePath(`/[orgSlug]/admin/courses/${input.id}`, 'page')
  return { success: true, data: data as Course }
}

export async function deleteCourse(courseId: string): Promise<ActionResult> {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/[orgSlug]/admin/courses', 'page')
  return { success: true }
}

export async function getCourse(courseId: string): Promise<ActionResult<Course>> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: data as Course }
}

export async function getCourseWithModules(courseId: string): Promise<ActionResult<CourseWithModules>> {
  const supabase = await createServerClient()

  // Get course
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()

  if (courseError) {
    return { success: false, error: courseError.message }
  }

  // Get modules with lessons
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select(`
      *,
      lessons (*)
    `)
    .eq('course_id', courseId)
    .order('sort_order', { ascending: true })

  if (modulesError) {
    return { success: false, error: modulesError.message }
  }

  // Sort lessons within each module
  const modulesWithSortedLessons = (modules as (Module & { lessons: Lesson[] })[]).map(m => ({
    ...m,
    lessons: m.lessons.sort((a, b) => a.sort_order - b.sort_order)
  }))

  return { 
    success: true, 
    data: {
      ...course,
      modules: modulesWithSortedLessons
    } as CourseWithModules
  }
}

export async function getOrgCourses(orgId: string): Promise<ActionResult<Course[]>> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: data as Course[] }
}

// ============================================
// MODULE ACTIONS
// ============================================

export interface CreateModuleInput {
  courseId: string
  title: string
  description?: string
}

export async function createModule(input: CreateModuleInput): Promise<ActionResult<Module>> {
  const supabase = await createServerClient()

  // Get the highest sort_order for this course
  const { data: existingModules } = await supabase
    .from('modules')
    .select('sort_order')
    .eq('course_id', input.courseId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSortOrder = existingModules && existingModules.length > 0 
    ? (existingModules[0] as { sort_order: number }).sort_order + 1 
    : 0

  const { data, error } = await supabase
    .from('modules')
    .insert({
      course_id: input.courseId,
      title: input.title,
      description: input.description ?? null,
      sort_order: nextSortOrder,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/[orgSlug]/admin/courses/[id]', 'page')
  return { success: true, data: data as Module }
}

export interface UpdateModuleInput {
  id: string
  title?: string
  description?: string
}

export async function updateModule(input: UpdateModuleInput): Promise<ActionResult<Module>> {
  const supabase = await createServerClient()

  const updateData: Record<string, unknown> = {}
  if (input.title !== undefined) updateData.title = input.title
  if (input.description !== undefined) updateData.description = input.description

  const { data, error } = await supabase
    .from('modules')
    .update(updateData)
    .eq('id', input.id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/[orgSlug]/admin/courses/[id]', 'page')
  return { success: true, data: data as Module }
}

export async function deleteModule(moduleId: string): Promise<ActionResult> {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('modules')
    .delete()
    .eq('id', moduleId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/[orgSlug]/admin/courses/[id]', 'page')
  return { success: true }
}

export interface ReorderModulesInput {
  courseId: string
  moduleIds: string[] // Array of module IDs in new order
}

export async function reorderModules(input: ReorderModulesInput): Promise<ActionResult> {
  const supabase = await createServerClient()

  // Update each module's sort_order
  const updates = input.moduleIds.map((id, index) => 
    supabase
      .from('modules')
      .update({ sort_order: index })
      .eq('id', id)
      .eq('course_id', input.courseId)
  )

  const results = await Promise.all(updates)
  const error = results.find(r => r.error)?.error

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/[orgSlug]/admin/courses/[id]', 'page')
  return { success: true }
}

// ============================================
// LESSON ACTIONS
// ============================================

export interface CreateLessonInput {
  moduleId: string
  title: string
  type?: LessonType
  description?: string
  content?: string
  videoUrl?: string
  videoProvider?: string
  videoId?: string
  duration?: number
  isPreview?: boolean
  isRequired?: boolean
}

export async function createLesson(input: CreateLessonInput): Promise<ActionResult<Lesson>> {
  const supabase = await createServerClient()

  // Get the highest sort_order for this module
  const { data: existingLessons } = await supabase
    .from('lessons')
    .select('sort_order')
    .eq('module_id', input.moduleId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSortOrder = existingLessons && existingLessons.length > 0 
    ? (existingLessons[0] as { sort_order: number }).sort_order + 1 
    : 0

  const { data, error } = await supabase
    .from('lessons')
    .insert({
      module_id: input.moduleId,
      title: input.title,
      type: input.type ?? 'video',
      description: input.description ?? null,
      content: input.content ?? null,
      video_url: input.videoUrl ?? null,
      video_provider: input.videoProvider ?? null,
      video_id: input.videoId ?? null,
      duration: input.duration ?? null,
      is_preview: input.isPreview ?? false,
      is_required: input.isRequired ?? true,
      sort_order: nextSortOrder,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/[orgSlug]/admin/courses/[id]', 'page')
  return { success: true, data: data as Lesson }
}

export interface UpdateLessonInput {
  id: string
  title?: string
  type?: LessonType
  description?: string
  content?: string
  videoUrl?: string
  videoProvider?: string
  videoId?: string
  duration?: number
  isPreview?: boolean
  isRequired?: boolean
}

export async function updateLesson(input: UpdateLessonInput): Promise<ActionResult<Lesson>> {
  const supabase = await createServerClient()

  const updateData: Record<string, unknown> = {}
  if (input.title !== undefined) updateData.title = input.title
  if (input.type !== undefined) updateData.type = input.type
  if (input.description !== undefined) updateData.description = input.description
  if (input.content !== undefined) updateData.content = input.content
  if (input.videoUrl !== undefined) updateData.video_url = input.videoUrl
  if (input.videoProvider !== undefined) updateData.video_provider = input.videoProvider
  if (input.videoId !== undefined) updateData.video_id = input.videoId
  if (input.duration !== undefined) updateData.duration = input.duration
  if (input.isPreview !== undefined) updateData.is_preview = input.isPreview
  if (input.isRequired !== undefined) updateData.is_required = input.isRequired

  const { data, error } = await supabase
    .from('lessons')
    .update(updateData)
    .eq('id', input.id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/[orgSlug]/admin/courses/[id]', 'page')
  return { success: true, data: data as Lesson }
}

export async function deleteLesson(lessonId: string): Promise<ActionResult> {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', lessonId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/[orgSlug]/admin/courses/[id]', 'page')
  return { success: true }
}

export interface ReorderLessonsInput {
  moduleId: string
  lessonIds: string[] // Array of lesson IDs in new order
}

export async function reorderLessons(input: ReorderLessonsInput): Promise<ActionResult> {
  const supabase = await createServerClient()

  // Update each lesson's sort_order
  const updates = input.lessonIds.map((id, index) => 
    supabase
      .from('lessons')
      .update({ sort_order: index })
      .eq('id', id)
      .eq('module_id', input.moduleId)
  )

  const results = await Promise.all(updates)
  const error = results.find(r => r.error)?.error

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/[orgSlug]/admin/courses/[id]', 'page')
  return { success: true }
}

export interface MoveLessonInput {
  lessonId: string
  fromModuleId: string
  toModuleId: string
  newSortOrder: number
}

export async function moveLesson(input: MoveLessonInput): Promise<ActionResult> {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('lessons')
    .update({ 
      module_id: input.toModuleId,
      sort_order: input.newSortOrder 
    })
    .eq('id', input.lessonId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/[orgSlug]/admin/courses/[id]', 'page')
  return { success: true }
}
