import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { getOrgBySlugOrDomain, getUser } from "@/lib/supabase/server"
import { getUserEnrollments, getUserCertificates } from "@/lib/enrollments/actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  GraduationCap, 
  BookOpen, 
  Clock, 
  Award,
  ChevronRight,
  PlayCircle,
  CheckCircle2,
  Trophy
} from "lucide-react"
import type { EnrollmentWithCourse, CertificateWithCourse } from "@/lib/supabase/types"

interface DashboardPageProps {
  params: Promise<{ orgSlug: string }>
}

export default async function StudentDashboard({ params }: DashboardPageProps) {
  const { orgSlug } = await params

  // Fetch organization
  const org = await getOrgBySlugOrDomain(orgSlug)
  if (!org) notFound()

  // Check authentication
  const user = await getUser()
  if (!user) {
    redirect(`/login?returnTo=/${orgSlug}/dashboard`)
  }

  // Fetch user's enrollments and certificates
  const [enrollmentsResult, certificatesResult] = await Promise.all([
    getUserEnrollments(org.id),
    getUserCertificates(org.id)
  ])

  const enrollments = enrollmentsResult.success ? enrollmentsResult.data ?? [] : []
  const certificates = certificatesResult.success ? certificatesResult.data ?? [] : []

  // Separate active and completed
  const activeEnrollments = enrollments.filter(e => e.status === 'active')
  const completedEnrollments = enrollments.filter(e => e.status === 'completed')

  // Find the most recent/in-progress course to continue
  const continueEnrollment = activeEnrollments
    .filter(e => e.progress_percent > 0)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/${orgSlug}`} className="flex items-center gap-3">
            {org.logo_url ? (
              <img
                src={org.logo_url}
                alt={org.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: org.primary_color }}
              >
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
            )}
            <span className="text-xl font-bold">{org.name}</span>
          </Link>

          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href={`/${orgSlug}/courses`}>
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Courses
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.fullName?.split(' ')[0] || 'Learner'}!
          </h1>
          <p className="text-muted-foreground">
            Track your progress and continue learning
          </p>
        </div>

        {/* Continue Learning Card */}
        {continueEnrollment && (
          <Card className="mb-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                {continueEnrollment.course.thumbnail_url ? (
                  <img
                    src={continueEnrollment.course.thumbnail_url}
                    alt={continueEnrollment.course.title}
                    className="w-full md:w-48 h-32 object-cover rounded-lg"
                  />
                ) : (
                  <div 
                    className="w-full md:w-48 h-32 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${org.primary_color}20` }}
                  >
                    <BookOpen className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Continue Learning</p>
                  <h2 className="text-xl font-semibold mb-2">{continueEnrollment.course.title}</h2>
                  <div className="flex items-center gap-4 mb-4">
                    <Progress value={continueEnrollment.progress_percent} className="flex-1 h-2" />
                    <span className="text-sm font-medium">
                      {Math.round(continueEnrollment.progress_percent)}%
                    </span>
                  </div>
                  <Button asChild>
                    <Link href={`/${orgSlug}/learn/${continueEnrollment.course.slug}`}>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Continue
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{enrollments.length}</p>
                <p className="text-sm text-muted-foreground">Enrolled</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeEnrollments.length}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedEnrollments.length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{certificates.length}</p>
                <p className="text-sm text-muted-foreground">Certificates</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Tabs */}
        <Tabs defaultValue="in-progress" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="in-progress">
              In Progress ({activeEnrollments.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedEnrollments.length})
            </TabsTrigger>
            <TabsTrigger value="certificates">
              Certificates ({certificates.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="in-progress">
            {activeEnrollments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No courses in progress</h3>
                  <p className="text-muted-foreground mb-4">
                    Start a new course to begin your learning journey
                  </p>
                  <Button asChild>
                    <Link href={`/${orgSlug}/courses`}>Browse Courses</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeEnrollments.map((enrollment) => (
                  <CourseCard 
                    key={enrollment.id} 
                    enrollment={enrollment} 
                    orgSlug={orgSlug}
                    orgColor={org.primary_color}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedEnrollments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No completed courses yet</h3>
                  <p className="text-muted-foreground">
                    Keep learning to complete your first course!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {completedEnrollments.map((enrollment) => (
                  <CourseCard 
                    key={enrollment.id} 
                    enrollment={enrollment} 
                    orgSlug={orgSlug}
                    orgColor={org.primary_color}
                    completed
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="certificates">
            {certificates.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No certificates yet</h3>
                  <p className="text-muted-foreground">
                    Complete courses to earn certificates
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {certificates.map((cert) => (
                  <CertificateCard 
                    key={cert.id} 
                    certificate={cert}
                    orgColor={org.primary_color}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8 px-4 mt-auto">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {org.name}. Powered by{" "}
            <a href="/" className="text-primary hover:underline">
              LearnStudio
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

// Course Card Component
function CourseCard({ 
  enrollment, 
  orgSlug,
  orgColor,
  completed = false 
}: { 
  enrollment: EnrollmentWithCourse
  orgSlug: string
  orgColor: string
  completed?: boolean 
}) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/${orgSlug}/learn/${enrollment.course.slug}`}>
        {enrollment.course.thumbnail_url ? (
          <img
            src={enrollment.course.thumbnail_url}
            alt={enrollment.course.title}
            className="w-full h-36 object-cover"
          />
        ) : (
          <div
            className="w-full h-36 flex items-center justify-center"
            style={{ backgroundColor: `${orgColor}20` }}
          >
            <BookOpen className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
      </Link>
      
      <CardHeader className="pb-2">
        <Link href={`/${orgSlug}/learn/${enrollment.course.slug}`}>
          <CardTitle className="text-lg line-clamp-2 hover:text-primary transition-colors">
            {enrollment.course.title}
          </CardTitle>
        </Link>
      </CardHeader>
      
      <CardContent>
        {completed ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Completed</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(enrollment.progress_percent)}%</span>
            </div>
            <Progress value={enrollment.progress_percent} className="h-2" />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button className="w-full" variant={completed ? "outline" : "default"} asChild>
          <Link href={`/${orgSlug}/learn/${enrollment.course.slug}`}>
            {completed ? 'Review Course' : 'Continue'}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

// Certificate Card Component
function CertificateCard({ 
  certificate,
  orgColor
}: { 
  certificate: CertificateWithCourse
  orgColor: string
}) {
  return (
    <Card className="overflow-hidden">
      <div 
        className="h-32 flex items-center justify-center"
        style={{ 
          background: `linear-gradient(135deg, ${orgColor}30 0%, ${orgColor}10 100%)` 
        }}
      >
        <Award className="h-16 w-16 text-primary" />
      </div>
      
      <CardHeader>
        <CardTitle className="text-lg line-clamp-2">
          {certificate.course.title}
        </CardTitle>
        <CardDescription>
          Issued {new Date(certificate.issued_at).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Certificate #{certificate.certificate_number}
        </p>
      </CardContent>
      
      <CardFooter>
        {certificate.pdf_url ? (
          <Button className="w-full" variant="outline" asChild>
            <a href={certificate.pdf_url} target="_blank" rel="noopener noreferrer">
              Download Certificate
            </a>
          </Button>
        ) : (
          <Button className="w-full" variant="outline" disabled>
            Certificate Available Soon
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
