'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ActionResult<T = void> {
  success: boolean
  error?: string
  data?: T
}

// ============================================
// VIDEO UPLOAD ACTIONS
// ============================================

export interface UploadVideoResult {
  url: string
  provider: 'supabase'
  videoId: string
  size: number
}

/**
 * Get a signed URL for uploading a video directly to Supabase Storage
 */
export async function getVideoUploadUrl(input: {
  orgId: string
  lessonId: string
  filename: string
  contentType: string
  fileSize: number
}): Promise<ActionResult<{ uploadUrl: string; videoPath: string }>> {
  const supabase = await createServerClient()

  // Validate file size (500MB max)
  const MAX_SIZE = 500 * 1024 * 1024 // 500MB
  if (input.fileSize > MAX_SIZE) {
    return { success: false, error: 'File too large. Maximum size is 500MB.' }
  }

  // Validate content type
  if (!input.contentType.startsWith('video/')) {
    return { success: false, error: 'Only video files are allowed.' }
  }

  // Create a unique path for the video
  const timestamp = Date.now()
  const sanitizedFilename = input.filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  const videoPath = `${input.orgId}/${input.lessonId}/${timestamp}-${sanitizedFilename}`

  // Create signed upload URL
  const { data, error } = await supabase.storage
    .from('videos')
    .createSignedUploadUrl(videoPath)

  if (error) {
    console.error('Failed to create upload URL:', error)
    return { success: false, error: 'Failed to create upload URL. Ensure the videos bucket exists.' }
  }

  return {
    success: true,
    data: {
      uploadUrl: data.signedUrl,
      videoPath,
    },
  }
}

/**
 * Complete video upload - save metadata and track usage
 */
export async function completeVideoUpload(input: {
  orgId: string
  lessonId: string
  videoPath: string
  fileSize: number
  duration?: number
}): Promise<ActionResult<{ videoUrl: string }>> {
  const supabase = await createServerClient()

  // Get public URL for the video
  const { data: urlData } = supabase.storage
    .from('videos')
    .getPublicUrl(input.videoPath)

  const videoUrl = urlData.publicUrl

  // Update lesson with video info
  const { error: lessonError } = await supabase
    .from('lessons')
    .update({
      video_url: videoUrl,
      video_provider: 'supabase',
      video_id: input.videoPath,
      duration: input.duration ?? null,
    })
    .eq('id', input.lessonId)

  if (lessonError) {
    console.error('Failed to update lesson:', lessonError)
    return { success: false, error: 'Failed to save video to lesson.' }
  }

  // Track usage event for video upload
  try {
    await supabase.from('usage_events').insert({
      org_id: input.orgId,
      event_type: 'video.upload',
      quantity: input.fileSize,
      unit: 'bytes',
      metadata: {
        lesson_id: input.lessonId,
        video_path: input.videoPath,
      },
    })
  } catch (e) {
    // Don't fail if usage tracking fails
    console.error('Failed to track video upload usage:', e)
  }

  revalidatePath('/[orgSlug]/admin/courses/[id]', 'page')
  return { success: true, data: { videoUrl } }
}

/**
 * Delete video from storage
 */
export async function deleteVideo(input: {
  orgId: string
  lessonId: string
  videoPath: string
}): Promise<ActionResult> {
  const supabase = await createServerClient()

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('videos')
    .remove([input.videoPath])

  if (storageError) {
    console.error('Failed to delete video from storage:', storageError)
    // Continue anyway to clear the lesson reference
  }

  // Clear video fields from lesson
  const { error: lessonError } = await supabase
    .from('lessons')
    .update({
      video_url: null,
      video_provider: null,
      video_id: null,
      duration: null,
    })
    .eq('id', input.lessonId)

  if (lessonError) {
    return { success: false, error: 'Failed to update lesson.' }
  }

  revalidatePath('/[orgSlug]/admin/courses/[id]', 'page')
  return { success: true }
}

// ============================================
// PROGRESS TRACKING ACTIONS
// ============================================

export interface SaveProgressInput {
  lessonId: string
  userId: string
  enrollmentId: string
  watchTime: number // Total seconds watched
  lastPosition: number // Current position in seconds
  duration: number // Total video duration
}

export async function saveVideoProgress(input: SaveProgressInput): Promise<ActionResult> {
  const supabase = await createServerClient()

  const isCompleted = input.lastPosition / input.duration >= 0.9

  // Upsert lesson progress
  const { error } = await supabase
    .from('lesson_progress')
    .upsert({
      lesson_id: input.lessonId,
      enrollment_id: input.enrollmentId,
      user_id: input.userId,
      watch_time: input.watchTime,
      last_position: input.lastPosition,
      completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'lesson_id,enrollment_id',
    })

  if (error) {
    console.error('Failed to save progress:', error)
    return { success: false, error: 'Failed to save progress.' }
  }

  return { success: true }
}

export interface GetProgressResult {
  watchTime: number
  lastPosition: number
  completed: boolean
}

export async function getVideoProgress(input: {
  lessonId: string
  enrollmentId: string
}): Promise<ActionResult<GetProgressResult | null>> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('lesson_progress')
    .select('watch_time, last_position, completed')
    .eq('lesson_id', input.lessonId)
    .eq('enrollment_id', input.enrollmentId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    console.error('Failed to get progress:', error)
    return { success: false, error: 'Failed to get progress.' }
  }

  if (!data) {
    return { success: true, data: null }
  }

  return {
    success: true,
    data: {
      watchTime: data.watch_time ?? 0,
      lastPosition: data.last_position ?? 0,
      completed: data.completed ?? false,
    },
  }
}

// ============================================
// USAGE TRACKING
// ============================================

export async function trackVideoStream(input: {
  orgId: string
  lessonId: string
  bytesStreamed: number
}): Promise<ActionResult> {
  const supabase = await createServerClient()

  try {
    await supabase.from('usage_events').insert({
      org_id: input.orgId,
      event_type: 'video.stream',
      quantity: input.bytesStreamed,
      unit: 'bytes',
      metadata: {
        lesson_id: input.lessonId,
      },
    })
  } catch (e) {
    console.error('Failed to track stream usage:', e)
    // Don't fail - usage tracking is best-effort
  }

  return { success: true }
}
