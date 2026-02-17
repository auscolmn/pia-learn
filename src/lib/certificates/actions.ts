'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  issueCertificate,
  regenerateCertificatePDF,
  generateCertificateNumber,
} from './generate'
import type { Certificate, CertificateWithCourse } from '@/lib/supabase/types'

export interface ActionResult<T = void> {
  success: boolean
  error?: string
  data?: T
}

// ============================================
// CERTIFICATE ISSUANCE
// ============================================

/**
 * Issue certificate for a completed enrollment
 * Called automatically when enrollment status is set to 'completed'
 */
export async function issueCertificateForEnrollment(
  enrollmentId: string
): Promise<ActionResult<Certificate>> {
  const supabase = await createServerClient()

  // Get enrollment details
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id, user_id, course_id, org_id, status')
    .eq('id', enrollmentId)
    .single()

  if (enrollmentError || !enrollment) {
    return { success: false, error: 'Enrollment not found' }
  }

  if (enrollment.status !== 'completed') {
    return { success: false, error: 'Enrollment is not completed' }
  }

  // Issue the certificate
  const result = await issueCertificate({
    enrollmentId: enrollment.id,
    userId: enrollment.user_id,
    courseId: enrollment.course_id,
    orgId: enrollment.org_id,
  })

  if (!result.success) {
    return { success: false, error: result.error }
  }

  // Fetch the created certificate
  const { data: certificate } = await supabase
    .from('certificates')
    .select('*')
    .eq('id', result.certificateId!)
    .single()

  revalidatePath('/[orgSlug]/dashboard', 'page')
  revalidatePath('/[orgSlug]/admin/certificates', 'page')

  return { success: true, data: certificate as Certificate }
}

/**
 * Manually issue a certificate (admin action)
 */
export async function manuallyIssueCertificate(params: {
  orgId: string
  userId: string
  courseId: string
  recipientName?: string
}): Promise<ActionResult<Certificate>> {
  const { orgId, userId, courseId, recipientName } = params
  const supabase = await createServerClient()

  // Check if user has an enrollment (not strictly required but good to check)
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single()

  // Check if certificate already exists
  const { data: existingCert } = await supabase
    .from('certificates')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single()

  if (existingCert) {
    return { success: false, error: 'Certificate already exists for this user and course' }
  }

  // Fetch required data
  const [userResult, courseResult, orgResult] = await Promise.all([
    supabase.from('users').select('full_name, email').eq('id', userId).single(),
    supabase.from('courses').select('title, instructor_id').eq('id', courseId).single(),
    supabase.from('organizations').select('name, logo_url, primary_color, secondary_color').eq('id', orgId).single(),
  ])

  if (!userResult.data || !courseResult.data || !orgResult.data) {
    return { success: false, error: 'Missing required data' }
  }

  const user = userResult.data
  const course = courseResult.data
  const org = orgResult.data

  // Get instructor name
  let instructorName: string | null = null
  if (course.instructor_id) {
    const { data: instructor } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', course.instructor_id)
      .single()
    instructorName = instructor?.full_name ?? null
  }

  const certificateNumber = generateCertificateNumber()
  const issuedAt = new Date().toISOString()
  const finalRecipientName = recipientName || user.full_name || user.email.split('@')[0]

  // Create certificate record
  const { data: certificate, error: createError } = await supabase
    .from('certificates')
    .insert({
      org_id: orgId,
      user_id: userId,
      course_id: courseId,
      enrollment_id: enrollment?.id ?? null,
      certificate_number: certificateNumber,
      recipient_name: finalRecipientName,
      issued_at: issuedAt,
      metadata: {
        course_title: course.title,
        org_name: org.name,
        instructor_name: instructorName,
        manually_issued: true,
      },
    })
    .select()
    .single()

  if (createError || !certificate) {
    return { success: false, error: `Failed to create certificate: ${createError?.message}` }
  }

  // Generate PDF asynchronously (don't block)
  regenerateCertificatePDF(certificate.id).catch(console.error)

  revalidatePath('/[orgSlug]/admin/certificates', 'page')
  return { success: true, data: certificate as Certificate }
}

// ============================================
// CERTIFICATE MANAGEMENT
// ============================================

/**
 * Get certificate by number (for public verification)
 */
export async function getCertificateByNumber(
  certificateNumber: string
): Promise<ActionResult<{
  certificate: Certificate
  course: { id: string; title: string; slug: string }
  org: { id: string; name: string; slug: string; logo_url: string | null }
  isValid: boolean
}>> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('certificates')
    .select(`
      *,
      course:courses(id, title, slug),
      org:organizations(id, name, slug, logo_url)
    `)
    .eq('certificate_number', certificateNumber)
    .single()

  if (error || !data) {
    return { success: false, error: 'Certificate not found' }
  }

  const course = Array.isArray(data.course) ? data.course[0] : data.course
  const org = Array.isArray(data.org) ? data.org[0] : data.org

  if (!course || !org) {
    return { success: false, error: 'Certificate data incomplete' }
  }

  // Check if certificate is revoked (via metadata)
  const isRevoked = (data.metadata as Record<string, unknown>)?.revoked === true

  return {
    success: true,
    data: {
      certificate: data as Certificate,
      course,
      org,
      isValid: !isRevoked,
    },
  }
}

/**
 * Revoke a certificate (admin action)
 */
export async function revokeCertificate(
  certificateId: string,
  reason?: string
): Promise<ActionResult> {
  const supabase = await createServerClient()

  const { data: cert, error: fetchError } = await supabase
    .from('certificates')
    .select('metadata')
    .eq('id', certificateId)
    .single()

  if (fetchError || !cert) {
    return { success: false, error: 'Certificate not found' }
  }

  const currentMetadata = (cert.metadata as Record<string, unknown>) || {}
  const updatedMetadata = {
    ...currentMetadata,
    revoked: true,
    revoked_at: new Date().toISOString(),
    revoke_reason: reason || 'Revoked by administrator',
  }

  const { error } = await supabase
    .from('certificates')
    .update({ metadata: updatedMetadata })
    .eq('id', certificateId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/[orgSlug]/admin/certificates', 'page')
  return { success: true }
}

/**
 * Restore a revoked certificate
 */
export async function restoreCertificate(certificateId: string): Promise<ActionResult> {
  const supabase = await createServerClient()

  const { data: cert, error: fetchError } = await supabase
    .from('certificates')
    .select('metadata')
    .eq('id', certificateId)
    .single()

  if (fetchError || !cert) {
    return { success: false, error: 'Certificate not found' }
  }

  const currentMetadata = (cert.metadata as Record<string, unknown>) || {}
  const { revoked, revoked_at, revoke_reason, ...restMetadata } = currentMetadata
  const updatedMetadata = {
    ...restMetadata,
    restored_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('certificates')
    .update({ metadata: updatedMetadata })
    .eq('id', certificateId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/[orgSlug]/admin/certificates', 'page')
  return { success: true }
}

/**
 * Regenerate PDF for a certificate
 */
export async function regenerateCertificate(certificateId: string): Promise<ActionResult<string>> {
  const result = await regenerateCertificatePDF(certificateId)

  if (!result.success) {
    return { success: false, error: result.error }
  }

  revalidatePath('/[orgSlug]/admin/certificates', 'page')
  return { success: true, data: result.pdfUrl }
}

/**
 * Search certificates by recipient name or certificate number
 */
export async function searchCertificates(
  orgId: string,
  query: string
): Promise<ActionResult<CertificateWithCourse[]>> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('certificates')
    .select(`
      *,
      course:courses(*)
    `)
    .eq('org_id', orgId)
    .or(`recipient_name.ilike.%${query}%,certificate_number.ilike.%${query}%`)
    .order('issued_at', { ascending: false })
    .limit(50)

  if (error) {
    return { success: false, error: error.message }
  }

  return {
    success: true,
    data: (data as CertificateWithCourse[]).filter((c) => c.course !== null),
  }
}
