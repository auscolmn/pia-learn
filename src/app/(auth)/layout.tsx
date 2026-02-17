import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                <span className="text-sm font-bold text-white">LS</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                LearnStudio
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex min-h-screen items-center justify-center px-4 py-20">
        {children}
      </main>
    </div>
  )
}
