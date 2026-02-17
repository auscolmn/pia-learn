import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCertificateByNumber } from '@/lib/certificates/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Award,
  CheckCircle2,
  XCircle,
  Calendar,
  GraduationCap,
  ExternalLink,
  Building2,
  User,
  FileText,
} from 'lucide-react'

interface VerifyPageProps {
  params: Promise<{ certificateNumber: string }>
}

export async function generateMetadata({ params }: VerifyPageProps): Promise<Metadata> {
  const { certificateNumber } = await params
  
  return {
    title: `Verify Certificate ${certificateNumber} | LearnStudio`,
    description: 'Verify the authenticity of a LearnStudio certificate',
  }
}

export default async function VerifyCertificatePage({ params }: VerifyPageProps) {
  const { certificateNumber } = await params

  const result = await getCertificateByNumber(certificateNumber)

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-destructive/10">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Certificate Not Found</CardTitle>
            <CardDescription>
              The certificate number <code className="font-mono bg-muted px-2 py-1 rounded">{certificateNumber}</code> does not exist in our records.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Please check the certificate number and try again. If you believe this is an error, contact the issuing organization.
            </p>
            <Button variant="outline" asChild>
              <Link href="/">Return Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { certificate, course, org, isValid } = result.data

  const formattedDate = new Date(certificate.issued_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">LearnStudio</span>
          </Link>
          <Badge variant="outline" className="font-mono">
            Certificate Verification
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Status Banner */}
          <div
            className={`rounded-lg p-6 mb-8 ${
              isValid
                ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
            }`}
          >
            <div className="flex items-center gap-4">
              {isValid ? (
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/50">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/50">
                  <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              )}
              <div>
                <h1
                  className={`text-xl font-bold ${
                    isValid
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-red-800 dark:text-red-200'
                  }`}
                >
                  {isValid ? 'Valid Certificate' : 'Certificate Revoked'}
                </h1>
                <p
                  className={`text-sm ${
                    isValid
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {isValid
                    ? 'This certificate is authentic and in good standing'
                    : 'This certificate has been revoked by the issuing organization'}
                </p>
              </div>
            </div>
          </div>

          {/* Certificate Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                {org.logo_url ? (
                  <img
                    src={org.logo_url}
                    alt={org.name}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div>
                  <CardTitle>{org.name}</CardTitle>
                  <CardDescription>Issuing Organization</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Recipient */}
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-muted">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recipient</p>
                  <p className="text-lg font-semibold">{certificate.recipient_name}</p>
                </div>
              </div>

              {/* Course */}
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-muted">
                  <Award className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Course Completed</p>
                  <p className="text-lg font-semibold">{course.title}</p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-muted">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date Issued</p>
                  <p className="text-lg font-semibold">{formattedDate}</p>
                </div>
              </div>

              {/* Certificate Number */}
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Certificate ID</p>
                  <p className="text-lg font-semibold font-mono">
                    {certificate.certificate_number}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-border flex flex-wrap gap-3">
                {certificate.pdf_url && (
                  <Button asChild>
                    <a href={certificate.pdf_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-2" />
                      Download PDF
                    </a>
                  </Button>
                )}
                <Button variant="outline" asChild>
                  <Link href={`/${org.slug}/courses/${course.slug}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Course
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/${org.slug}`}>
                    <Building2 className="h-4 w-4 mr-2" />
                    Visit {org.name}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            This verification page confirms the authenticity of certificates issued through LearnStudio.
            For any questions, please contact the issuing organization.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8 px-4 mt-auto">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} LearnStudio. Certificate Verification System.
          </p>
        </div>
      </footer>
    </div>
  )
}
