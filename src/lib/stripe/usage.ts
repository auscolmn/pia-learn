import { createServiceClient } from '@/lib/supabase/service'

type UsageEventType = 
  | 'student.login'
  | 'student.active'
  | 'video.upload'
  | 'video.stream'
  | 'video.delete'
  | 'certificate.issued'
  | 'course.created'
  | 'course.published'
  | 'lesson.created'
  | 'quiz.completed'
  | 'storage.upload'
  | 'storage.delete'

interface TrackUsageParams {
  orgId: string
  eventType: UsageEventType
  quantity?: number
  unit?: string
  resourceId?: string
  resourceType?: string
  userId?: string
  metadata?: Record<string, unknown>
}

/**
 * Track a usage event using the service client (bypasses RLS)
 * Use this in webhooks or background jobs
 */
export async function trackUsageEvent(params: TrackUsageParams): Promise<void> {
  const {
    orgId,
    eventType,
    quantity = 1,
    unit,
    resourceId,
    resourceType,
    userId,
    metadata = {},
  } = params

  try {
    const supabase = createServiceClient()

    await supabase.from('usage_events').insert({
      org_id: orgId,
      event_type: eventType,
      quantity,
      unit,
      resource_id: resourceId,
      resource_type: resourceType,
      user_id: userId,
      metadata,
    })
  } catch (error) {
    // Don't fail operations due to usage tracking errors
    console.error('Failed to track usage event:', error)
  }
}

/**
 * Track a certificate issuance event
 */
export async function trackCertificateIssued(params: {
  orgId: string
  userId: string
  certificateId: string
  courseId: string
}): Promise<void> {
  await trackUsageEvent({
    orgId: params.orgId,
    eventType: 'certificate.issued',
    quantity: 1,
    unit: 'count',
    resourceId: params.certificateId,
    resourceType: 'certificate',
    userId: params.userId,
    metadata: {
      course_id: params.courseId,
    },
  })
}

/**
 * Track a video upload event
 */
export async function trackVideoUpload(params: {
  orgId: string
  lessonId: string
  bytes: number
}): Promise<void> {
  await trackUsageEvent({
    orgId: params.orgId,
    eventType: 'video.upload',
    quantity: params.bytes,
    unit: 'bytes',
    resourceId: params.lessonId,
    resourceType: 'lesson',
  })
}

/**
 * Track a video stream event
 */
export async function trackVideoStream(params: {
  orgId: string
  lessonId: string
  bytes: number
  userId?: string
}): Promise<void> {
  await trackUsageEvent({
    orgId: params.orgId,
    eventType: 'video.stream',
    quantity: params.bytes,
    unit: 'bytes',
    resourceId: params.lessonId,
    resourceType: 'lesson',
    userId: params.userId,
  })
}

/**
 * Track course creation
 */
export async function trackCourseCreated(params: {
  orgId: string
  courseId: string
}): Promise<void> {
  await trackUsageEvent({
    orgId: params.orgId,
    eventType: 'course.created',
    quantity: 1,
    resourceId: params.courseId,
    resourceType: 'course',
  })
}

/**
 * Track course publication
 */
export async function trackCoursePublished(params: {
  orgId: string
  courseId: string
}): Promise<void> {
  await trackUsageEvent({
    orgId: params.orgId,
    eventType: 'course.published',
    quantity: 1,
    resourceId: params.courseId,
    resourceType: 'course',
  })
}
