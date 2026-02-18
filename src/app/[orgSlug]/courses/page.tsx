import { notFound } from "next/navigation"
import Link from "next/link"
import { getOrgBySlugOrDomain, createServerClient, getUser } from "@/lib/supabase/server"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GraduationCap, BookOpen, Clock, Search, Users, ArrowLeft } from "lucide-react"
import type { Course, User } from "@/lib/supabase/types"

interface CoursesPageProps {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ q?: string; tag?: string }>
}

interface CourseWithInstructor extends Course {
  instructor: User | null
}

export default async function CoursesPage({ params, searchParams }: CoursesPageProps) {
  const { orgSlug } = await params
  const { q: searchQuery, tag: filterTag } = await searchParams

  // Fetch organization
  const org = await getOrgBySlugOrDomain(orgSlug)
  if (!org) notFound()

  const user = await getUser()

  // Build query
  const supabase = await createServerClient()
  let query = supabase
    .from("courses")
    .select(`
      *,
      instructor:users!courses_instructor_id_fkey(id, email, full_name, avatar_url)
    `)
    .eq("org_id", org.id)
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })

  // Apply search filter
  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,short_description.ilike.%${searchQuery}%`)
  }

  // Apply tag filter
  if (filterTag) {
    query = query.contains("tags", [filterTag])
  }

  const { data: coursesData } = await query
  const courses = (coursesData ?? []) as CourseWithInstructor[]

  // Get unique tags for filtering
  const allTags = new Set<string>()
  courses.forEach(course => {
    course.tags?.forEach(tag => allTags.add(tag))
  })

  // Get enrollment status for logged in user
  let enrolledCourseIds = new Set<string>()
  if (user) {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("user_id", user.id)
      .in("status", ["active", "completed"])

    enrolledCourseIds = new Set((enrollments ?? []).map(e => e.course_id))
  }

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

      <main className="container mx-auto px-4 py-8">
        {/* Page Title & Search */}
        <div className="mb-8">
          <Link 
            href={`/${orgSlug}`} 
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <h1 className="text-3xl font-bold mb-2">Course Catalog</h1>
          <p className="text-muted-foreground">
            Browse our courses and start learning today
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <form className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              name="q"
              placeholder="Search courses..."
              defaultValue={searchQuery}
              className="pl-10"
            />
          </form>
          
          {allTags.size > 0 && (
            <div className="flex flex-wrap gap-2">
              {filterTag && (
                <Link href={`/${orgSlug}/courses`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                    Clear filter ×
                  </Badge>
                </Link>
              )}
              {Array.from(allTags).slice(0, 5).map(tag => (
                <Link key={tag} href={`/${orgSlug}/courses?tag=${encodeURIComponent(tag)}`}>
                  <Badge 
                    variant={filterTag === tag ? "default" : "secondary"}
                    className="cursor-pointer hover:opacity-80"
                  >
                    {tag}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Course Grid */}
        {courses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery || filterTag ? "No courses found" : "No courses yet"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery || filterTag 
                  ? "Try adjusting your search or filters" 
                  : "Check back soon for new courses!"}
              </p>
              {(searchQuery || filterTag) && (
                <Button variant="outline" className="mt-4" asChild>
                  <Link href={`/${orgSlug}/courses`}>Clear filters</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const isEnrolled = enrolledCourseIds.has(course.id)
              
              return (
                <Card 
                  key={course.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                >
                  <Link href={`/${orgSlug}/courses/${course.slug}`}>
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-48 flex items-center justify-center"
                        style={{ backgroundColor: `${org.primary_color}20` }}
                      >
                        <BookOpen className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </Link>
                  
                  <CardHeader className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/${orgSlug}/courses/${course.slug}`}>
                        <CardTitle className="line-clamp-2 hover:text-primary transition-colors">
                          {course.title}
                        </CardTitle>
                      </Link>
                      {course.is_featured && (
                        <Badge className="shrink-0">Featured</Badge>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {course.short_description || course.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {course.instructor && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{course.instructor.full_name || 'Instructor'}</span>
                        </div>
                      )}
                      {course.estimated_duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{Math.round(course.estimated_duration / 60)}h</span>
                        </div>
                      )}
                    </div>
                    
                    {course.tags && course.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {course.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="border-t pt-4 flex items-center justify-between">
                    {course.price > 0 ? (
                      <span className="font-semibold text-lg">
                        ${course.price.toFixed(2)} {course.currency}
                      </span>
                    ) : (
                      <Badge variant="secondary">Free</Badge>
                    )}
                    
                    <Button asChild size="sm">
                      <Link href={`/${orgSlug}/courses/${course.slug}`}>
                        {isEnrolled ? "Continue Learning" : "View Course"}
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
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
