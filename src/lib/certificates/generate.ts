import { renderToBuffer } from '@react-pdf/renderer'
import QRCode from 'qrcode'
import { createServerClient } from '@/lib/supabase/server'
import { createCertificateDocument, type CertificateData } from '@/components/certificates/CertificateTemplate'

/**
 * Generate a unique certificate number
 * Format: CERT-XXXX-XXXX-XXXX (alphanumeric)
 */
export function generateCertificateNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const segments: string[] = []

  for (let s = 0; s < 3; s++) {
    let segment = ''
    for (let i = 0; i < 4; i++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    segments.push(segment)
  }

  return `CERT-${segments.join('-')}`
}

/**
 * Generate QR code as data URL
 */
export async function generateQRCode(verificationUrl: string): Promise<string> {
  return QRCode.toDataURL(verificationUrl, {
    width: 200,
    margin: 1,
    color: {
      dark: '#1F2937',
      light: '#FFFFFF',
    },
  })
}

/**
 * Get the base URL for verification
 */
function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'http://localhost:3000'
}

/**
 * Generate a PDF certificate and upload to Supabase Storage
 */
export async function generateCertificatePDF(params: {
  certificateId: string
  certificateNumber: string
  recipientName: string
  courseTitle: string
  orgName: string
  orgLogoUrl?: string | null
  primaryColor: string
  secondaryColor: string
  issuedAt: string
  instructorName?: string | null
  orgId: string
}): Promise<{ pdfUrl: string; pdfBuffer: Buffer }> {
  const {
    certificateId,
    certificateNumber,
    recipientName,
    courseTitle,
    orgName,
    orgLogoUrl,
    primaryColor,
    secondaryColor,
    issuedAt,
    instructorName,
    orgId,
  } = params

  // Generate verification URL and QR code
  const verificationUrl = `${getBaseUrl()}/verify/${certificateNumber}`
  const qrCodeDataUrl = await generateQRCode(verificationUrl)

  // Prepare certificate data
  const certificateData: CertificateData = {
    recipientName,
    courseTitle,
    orgName,
    orgLogoUrl,
    primaryColor,
    secondaryColor,
    certificateNumber,
    issuedAt,
    qrCodeDataUrl,
    instructorName,
  }

  // Generate PDF buffer
  const document = createCertificateDocument(certificateData)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(document as any)

  // Upload to Supabase Storage
  const supabase = await createServerClient()
  const fileName = `${orgId}/${certificateId}.pdf`

  const { error: uploadError } = await supabase.storage
    .from('certificates')
    .upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`Failed to upload certificate PDF: ${uploadError.message}`)
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('certificates').getPublicUrl(fileName)

  return { pdfUrl: publicUrl, pdfBuffer }
}

/**
 * Issue a certificate for a completed enrollment
 */
export async function issueCertificate(params: {
  enrollmentId: string
  userId: string
  courseId: string
  orgId: string
}): Promise<{
  success: boolean
  error?: string
  certificateId?: string
  certificateNumber?: string
  pdfUrl?: string
}> {
  const { enrollmentId, userId, courseId, orgId } = params
  const supabase = await createServerClient()

  // Check if certificate already exists for this enrollment
  const { data: existingCert } = await supabase
    .from('certificates')
    .select('id, certificate_number, pdf_url')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single()

  if (existingCert) {
    return {
      success: true,
      certificateId: existingCert.id,
      certificateNumber: existingCert.certificate_number,
      pdfUrl: existingCert.pdf_url ?? undefined,
    }
  }

  // Fetch required data
  const [userResult, courseResult, orgResult] = await Promise.all([
    supabase.from('users').select('full_name, email').eq('id', userId).single(),
    supabase
      .from('courses')
      .select('title, instructor_id')
      .eq('id', courseId)
      .single(),
    supabase
      .from('organizations')
      .select('name, logo_url, primary_color, secondary_color')
      .eq('id', orgId)
      .single(),
  ])

  if (userResult.error || !userResult.data) {
    return { success: false, error: 'User not found' }
  }
  if (courseResult.error || !courseResult.data) {
    return { success: false, error: 'Course not found' }
  }
  if (orgResult.error || !orgResult.data) {
    return { success: false, error: 'Organization not found' }
  }

  const user = userResult.data
  const course = courseResult.data
  const org = orgResult.data

  // Get instructor name if available
  let instructorName: string | null = null
  if (course.instructor_id) {
    const { data: instructor } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', course.instructor_id)
      .single()
    instructorName = instructor?.full_name ?? null
  }

  // Generate certificate number
  const certificateNumber = generateCertificateNumber()
  const issuedAt = new Date().toISOString()
  const recipientName = user.full_name || user.email.split('@')[0]

  // Create certificate record first (to get ID)
  const { data: certificate, error: createError } = await supabase
    .from('certificates')
    .insert({
      org_id: orgId,
      user_id: userId,
      course_id: courseId,
      enrollment_id: enrollmentId,
      certificate_number: certificateNumber,
      recipient_name: recipientName,
      issued_at: issuedAt,
      metadata: {
        course_title: course.title,
        org_name: org.name,
        instructor_name: instructorName,
      },
    })
    .select()
    .single()

  if (createError || !certificate) {
    return {
      success: false,
      error: `Failed to create certificate: ${createError?.message}`,
    }
  }

  // Generate PDF
  try {
    const { pdfUrl } = await generateCertificatePDF({
      certificateId: certificate.id,
      certificateNumber,
      recipientName,
      courseTitle: course.title,
      orgName: org.name,
      orgLogoUrl: org.logo_url,
      primaryColor: org.primary_color,
      secondaryColor: org.secondary_color,
      issuedAt,
      instructorName,
      orgId,
    })

    // Update certificate with PDF URL
    await supabase
      .from('certificates')
      .update({ pdf_url: pdfUrl })
      .eq('id', certificate.id)

    return {
      success: true,
      certificateId: certificate.id,
      certificateNumber,
      pdfUrl,
    }
  } catch (pdfError) {
    // Certificate record exists but PDF failed - still return success
    console.error('PDF generation failed:', pdfError)
    return {
      success: true,
      certificateId: certificate.id,
      certificateNumber,
      error: 'Certificate created but PDF generation failed',
    }
  }
}

/**
 * Regenerate PDF for an existing certificate
 */
export async function regenerateCertificatePDF(certificateId: string): Promise<{
  success: boolean
  error?: string
  pdfUrl?: string
}> {
  const supabase = await createServerClient()

  // Fetch certificate with related data
  const { data: cert, error: certError } = await supabase
    .from('certificates')
    .select(
      `
      *,
      user:users(full_name, email),
      course:courses(title, instructor_id),
      org:organizations(name, logo_url, primary_color, secondary_color)
    `
    )
    .eq('id', certificateId)
    .single()

  if (certError || !cert) {
    return { success: false, error: 'Certificate not found' }
  }

  const user = Array.isArray(cert.user) ? cert.user[0] : cert.user
  const course = Array.isArray(cert.course) ? cert.course[0] : cert.course
  const org = Array.isArray(cert.org) ? cert.org[0] : cert.org

  if (!user || !course || !org) {
    return { success: false, error: 'Missing related data' }
  }

  // Get instructor name if available
  let instructorName: string | null = null
  if (course.instructor_id) {
    const { data: instructor } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', course.instructor_id)
      .single()
    instructorName = instructor?.full_name ?? null
  }

  try {
    const { pdfUrl } = await generateCertificatePDF({
      certificateId: cert.id,
      certificateNumber: cert.certificate_number,
      recipientName: cert.recipient_name,
      courseTitle: course.title,
      orgName: org.name,
      orgLogoUrl: org.logo_url,
      primaryColor: org.primary_color,
      secondaryColor: org.secondary_color,
      issuedAt: cert.issued_at,
      instructorName,
      orgId: cert.org_id,
    })

    // Update certificate with new PDF URL
    await supabase
      .from('certificates')
      .update({ pdf_url: pdfUrl })
      .eq('id', certificateId)

    return { success: true, pdfUrl }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'PDF generation failed',
    }
  }
}
