import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { UserMenu } from '@/components/auth/user-menu'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                <span className="text-sm font-bold text-white">LS</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                LearnStudio
              </span>
            </Link>

            <nav className="hidden items-center gap-6 md:flex">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
              {user.isPlatformAdmin && (
                <Link
                  href="/platform"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Platform Admin
                </Link>
              )}
            </nav>

            <UserMenu user={user} />
          </div>
        </div>
      </header>

      {/* Content */}
      <main>{children}</main>
    </div>
  )
}
