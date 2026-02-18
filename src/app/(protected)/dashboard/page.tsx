import Link from 'next/link'
import { getUser, getUserOrganizations } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Plus, BookOpen, Users, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Dashboard | LearnStudio',
  description: 'Your LearnStudio dashboard',
}

export default async function DashboardPage() {
  const user = await getUser()
  
  if (!user) {
    return null // Layout handles redirect
  }

  const memberships = await getUserOrganizations(user.id)
  const organizations = memberships.map(m => ({
    ...m.organization,
    role: m.role,
  }))

  return (
    <div className="py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{user.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}!
          </h1>
          <p className="mt-1 text-gray-600">
            Manage your organizations and courses
          </p>
        </div>

        {/* Organizations */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Your Organizations
            </h2>
            <Link href="/create-org">
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Organization
              </Button>
            </Link>
          </div>

          {organizations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                  <Building2 className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  No organizations yet
                </h3>
                <p className="mb-4 max-w-sm text-gray-600">
                  Create your first organization to start building courses and
                  inviting students.
                </p>
                <Link href="/create-org">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Organization
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {organizations.map((org) => (
                <Card key={org.id} className="transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{ backgroundColor: org.primary_color }}
                      >
                        {org.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={org.logo_url}
                            alt={org.name}
                            className="h-6 w-6 object-contain"
                          />
                        ) : (
                          <span className="text-sm font-bold text-white">
                            {org.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                        {org.role}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{org.name}</CardTitle>
                    <CardDescription>
                      {org.slug}.learnstudio.com
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span>0 courses</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>0 students</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/${org.slug}`} className="flex-1">
                        <Button variant="outline" className="w-full" size="sm">
                          View Site
                        </Button>
                      </Link>
                      {org.role === 'admin' && (
                        <Link href={`/${org.slug}/admin`} className="flex-1">
                          <Button className="w-full" size="sm">
                            Admin
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Quick Actions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction
              title="View Profile"
              description="Update your account settings"
              href="/settings/profile"
              icon={<Users className="h-5 w-5" />}
            />
            <QuickAction
              title="Browse Courses"
              description="Discover new learning opportunities"
              href="/courses"
              icon={<BookOpen className="h-5 w-5" />}
            />
            <QuickAction
              title="My Enrollments"
              description="Continue where you left off"
              href="/my-courses"
              icon={<BookOpen className="h-5 w-5" />}
            />
            <QuickAction
              title="Help & Support"
              description="Get help with LearnStudio"
              href="/help"
              icon={<Building2 className="h-5 w-5" />}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickAction({
  title,
  description,
  href,
  icon,
}: {
  title: string
  description: string
  href: string
  icon: React.ReactNode
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            {icon}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
