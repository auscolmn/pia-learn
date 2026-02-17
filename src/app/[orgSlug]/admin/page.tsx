import { createServerClient } from '@/lib/supabase/server'
import { getOrgBySlugOrDomain } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, GraduationCap, DollarSign, Award, ArrowUpRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface AdminDashboardProps {
  params: Promise<{ orgSlug: string }>
}

interface OrgStats {
  total_courses: number
  published_courses: number
  total_students: number
  total_enrollments: number
  total_certificates: number
  revenue_total: number
}

async function getOrgStats(orgId: string): Promise<OrgStats> {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase.rpc('get_org_stats', { org_uuid: orgId })
  
  if (error || !data) {
    return {
      total_courses: 0,
      published_courses: 0,
      total_students: 0,
      total_enrollments: 0,
      total_certificates: 0,
      revenue_total: 0,
    }
  }
  
  return data as OrgStats
}

interface RecentActivity {
  id: string
  type: 'enrollment' | 'course' | 'certificate'
  description: string
  time: string
}

async function getRecentActivity(orgId: string): Promise<RecentActivity[]> {
  const supabase = await createServerClient()
  
  // Get recent enrollments
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      enrolled_at,
      user:users(full_name, email),
      course:courses(title)
    `)
    .eq('org_id', orgId)
    .order('enrolled_at', { ascending: false })
    .limit(5)

  const activities: RecentActivity[] = (enrollments ?? []).map((e) => {
    // Supabase returns single-row joins as objects, but TypeScript thinks they could be arrays
    const user = e.user as unknown as { full_name?: string | null; email: string } | null
    const course = e.course as unknown as { title: string } | null
    return {
      id: e.id,
      type: 'enrollment' as const,
      description: `${user?.full_name ?? user?.email ?? 'Someone'} enrolled in ${course?.title ?? 'a course'}`,
      time: new Date(e.enrolled_at).toLocaleDateString(),
    }
  })

  return activities
}

async function getRecentCourses(orgId: string) {
  const supabase = await createServerClient()
  
  const { data } = await supabase
    .from('courses')
    .select('id, title, slug, status, created_at, thumbnail_url')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(5)

  return data ?? []
}

export default async function AdminDashboard({ params }: AdminDashboardProps) {
  const { orgSlug } = await params
  
  const org = await getOrgBySlugOrDomain(orgSlug)
  if (!org) return null

  const [stats, activities, recentCourses] = await Promise.all([
    getOrgStats(org.id),
    getRecentActivity(org.id),
    getRecentCourses(org.id),
  ])

  const statCards = [
    {
      title: 'Total Courses',
      value: stats.total_courses,
      subValue: `${stats.published_courses} published`,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Students',
      value: stats.total_students,
      subValue: `${stats.total_enrollments} enrollments`,
      icon: GraduationCap,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Revenue',
      value: `$${stats.revenue_total.toLocaleString()}`,
      subValue: 'All time',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Certificates',
      value: stats.total_certificates,
      subValue: 'Issued',
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here&apos;s what&apos;s happening with {org.name}.</p>
        </div>
        <Button asChild>
          <Link href={`/${orgSlug}/admin/courses/new`}>
            Create Course
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.subValue}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Courses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Courses</CardTitle>
              <CardDescription>Your latest courses</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${orgSlug}/admin/courses`}>
                View all <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentCourses.length === 0 ? (
              <div className="text-center py-6">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">No courses yet</p>
                <Button asChild className="mt-4" size="sm">
                  <Link href={`/${orgSlug}/admin/courses/new`}>Create your first course</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentCourses.map((course) => (
                  <Link 
                    key={course.id}
                    href={`/${orgSlug}/admin/courses/${course.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {course.thumbnail_url ? (
                      <img 
                        src={course.thumbnail_url} 
                        alt={course.title}
                        className="h-12 w-16 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-12 w-16 rounded-md bg-gray-100 flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{course.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(course.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge 
                      variant={course.status === 'published' ? 'default' : 'secondary'}
                      className={course.status === 'published' 
                        ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                        : ''
                      }
                    >
                      {course.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>Latest enrollments and updates</CardDescription>
            </div>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-6">
                <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">No activity yet</p>
                <p className="text-xs text-gray-500 mt-1">
                  Activity will appear here when students enroll
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50">
                      <GraduationCap className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
