import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { getOrgBySlugOrDomain, createServerClient, getUser } from "@/lib/supabase/server"
import { getEnrollment } from "@/lib/enrollments/actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { 
  GraduationCap, 
  BookOpen, 
  Clock, 
  Users, 
  ArrowLeft,
  PlayCircle,
  FileText,
  HelpCircle,
  CheckCircle,
  Lock,
  ChevronRight
} from "lucide-react"
import type { Course, User, Module, Lesson } from "@/lib/supabase/types"
import { EnrollButton } from "./_components/enroll-button"

interface CourseDetailPageProps {
  params: Promise<{ orgSlug: string; slug: string }>
}

interface CourseWithDetails extends Course {
  instructor: User | null
  modules: (Module & { lessons: Lesson[] })[]
}

function getLessonIcon(type: string) {
  switch (type) {
    case 'video':
      return PlayCircle
    case 'text':
      return FileText
    case 'quiz':
      return HelpCircle
    default:
      return BookOpen
  }
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { orgSlug, slug } = await params

  // Fetch organization
  const org = await getOrgBySlugOrDomain(orgSlug)
  if (!org) notFound()

  const user = await getUser()

  // Fetch course with modules and lessons
  const supabase = await createServerClient()
  const { data: courseData, error } = await supabase
    .from("courses")
    .select(`
      *,
      instructor:users!courses_instructor_id_fkey(id, email, full_name, avatar_url),
      modules (
        *,
        lessons (*)
      )
    `)
    .eq("org_id", org.id)
    .eq("slug", slug)
    .single()

  if (error || !courseData) {
    notFound()
  }

  const course = courseData as CourseWithDetails

  // Only show published courses (unless user is admin/instructor)
  if (course.status !== 'published') {
    notFound()
  }

  // Sort modules and lessons
  course.modules = course.modules
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(m => ({
      ...m,
      lessons: m.lessons.sort((a, b) => a.sort_order - b.sort_order)
    }))

  // Get enrollment status
  let enrollment = null
  if (user) {
    const result = await getEnrollment(course.id)
    if (result.success) {
      enrollment = result.data
    }
  }

  const isEnrolled = enrollment?.status === 'active' || enrollment?.status === 'completed'

  // Calculate totals
  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0)
  const totalDuration = course.modules.reduce(
    (acc, m) => acc + m.lessons.reduce((a, l) => a + (l.duration || 0), 0),
    0
  )
  const previewLessons = course.modules.flatMap(m => 
    m.lessons.filter(l => l.is_preview)
  )

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
            {user ? (
              <Button asChild>
                <Link href={`/${orgSlug}/dashboard`}>My Learning</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section 
          className="py-12 px-4"
          style={{
            background: `linear-gradient(135deg, ${org.primary_color}15 0%, ${org.secondary_color}15 100%)`,
          }}
        >
          <div className="container mx-auto">
            <Link 
              href={`/${orgSlug}/courses`} 
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to courses
            </Link>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Course Info */}
              <div className="lg:col-span-2">
                <div className="flex flex-wrap gap-2 mb-4">
                  {course.is_featured && (
                    <Badge>Featured</Badge>
                  )}
                  {course.difficulty_level && (
                    <Badge variant="outline">{course.difficulty_level}</Badge>
                  )}
                  {course.tags?.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>
                
                <p className="text-lg text-muted-foreground mb-6">
                  {course.short_description || course.description}
                </p>

                <div className="flex flex-wrap items-center gap-6 text-sm">
                  {course.instructor && (
                    <div className="flex items-center gap-2">
                      {course.instructor.avatar_url ? (
                        <img 
                          src={course.instructor.avatar_url} 
                          alt={course.instructor.full_name || ''}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4" />
                        </div>
                      )}
                      <span className="font-medium">
                        {course.instructor.full_name || 'Instructor'}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>{totalLessons} lessons</span>
                  </div>
                  
                  {totalDuration > 0 && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(totalDuration)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Enrollment Card */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  {course.thumbnail_url && (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full aspect-video object-cover rounded-t-lg"
                    />
                  )}
                  <CardContent className="p-6">
                    <div className="mb-6">
                      {course.price > 0 ? (
                        <div className="text-3xl font-bold">
                          ${course.price.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">{course.currency}</span>
                        </div>
                      ) : (
                        <div className="text-3xl font-bold text-green-600">Free</div>
                      )}
                    </div>

                    {isEnrolled ? (
                      <Button className="w-full" size="lg" asChild>
                        <Link href={`/${orgSlug}/learn/${course.slug}`}>
                          Continue Learning
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    ) : (
                      <EnrollButton
                        orgId={org.id}
                        orgSlug={orgSlug}
                        courseId={course.id}
                        courseSlug={course.slug}
                        price={course.price}
                        isLoggedIn={!!user}
                      />
                    )}

                    {enrollment?.status === 'completed' && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Course Completed!</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Course Content */}
        <section className="py-12 px-4">
          <div className="container mx-auto">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Description */}
                {course.description && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">About This Course</h2>
                    <div className="prose prose-neutral max-w-none">
                      <p className="whitespace-pre-line">{course.description}</p>
                    </div>
                  </div>
                )}

                {/* Learning Outcomes */}
                {course.learning_outcomes && course.learning_outcomes.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">What You&apos;ll Learn</h2>
                    <ul className="grid md:grid-cols-2 gap-3">
                      {course.learning_outcomes.map((outcome, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Requirements */}
                {course.requirements && course.requirements.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Requirements</h2>
                    <ul className="space-y-2">
                      {course.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-muted-foreground">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Curriculum */}
                <div>
                  <h2 className="text-2xl font-bold mb-4">Curriculum</h2>
                  <Card>
                    <Accordion type="multiple" defaultValue={["module-0"]} className="w-full">
                      {course.modules.map((module, moduleIndex) => (
                        <AccordionItem key={module.id} value={`module-${moduleIndex}`}>
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-2 text-left">
                              <span className="font-semibold">{module.title}</span>
                              <Badge variant="outline" className="ml-2">
                                {module.lessons.length} lessons
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="border-t">
                              {module.lessons.map((lesson, lessonIndex) => {
                                const LessonIcon = getLessonIcon(lesson.type)
                                const canAccess = isEnrolled || lesson.is_preview

                                return (
                                  <div 
                                    key={lesson.id}
                                    className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 hover:bg-muted/50"
                                  >
                                    <div className="flex items-center gap-3">
                                      <LessonIcon className="h-4 w-4 text-muted-foreground" />
                                      <span className={!canAccess ? "text-muted-foreground" : ""}>
                                        {lesson.title}
                                      </span>
                                      {lesson.is_preview && !isEnrolled && (
                                        <Badge variant="secondary" className="text-xs">
                                          Preview
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {lesson.duration && (
                                        <span className="text-sm text-muted-foreground">
                                          {formatDuration(lesson.duration)}
                                        </span>
                                      )}
                                      {!canAccess && (
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </Card>
                </div>
              </div>

              {/* Instructor */}
              {course.instructor && (
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Your Instructor</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center text-center">
                      {course.instructor.avatar_url ? (
                        <img 
                          src={course.instructor.avatar_url} 
                          alt={course.instructor.full_name || ''}
                          className="w-24 h-24 rounded-full object-cover mb-4"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                          <Users className="h-12 w-12 text-primary" />
                        </div>
                      )}
                      <h3 className="font-semibold text-lg">
                        {course.instructor.full_name || 'Instructor'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {course.instructor.email}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8 px-4 mt-auto">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {org.name}. Powered by{" "}
            <Link href="/" className="text-primary hover:underline">
              LearnStudio
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
