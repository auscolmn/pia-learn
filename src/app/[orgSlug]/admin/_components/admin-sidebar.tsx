'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  BarChart3,
  Award,
  Menu,
  X,
  GraduationCap,
  CreditCard,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface AdminSidebarProps {
  orgSlug: string
  orgName: string
  orgLogo?: string | null
}

const navigation = [
  { name: 'Dashboard', href: '', icon: LayoutDashboard },
  { name: 'Courses', href: '/courses', icon: BookOpen },
  { name: 'Students', href: '/students', icon: GraduationCap },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Certificates', href: '/certificates', icon: Award },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Billing', href: '/billing', icon: CreditCard },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function AdminSidebar({ orgSlug, orgName, orgLogo }: AdminSidebarProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const basePath = `/${orgSlug}/admin`

  const isActive = (href: string) => {
    const fullPath = `${basePath}${href}`
    if (href === '') {
      return pathname === basePath || pathname === `${basePath}/`
    }
    return pathname.startsWith(fullPath)
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-4">
        {orgLogo ? (
          <img src={orgLogo} alt={orgName} className="h-8 w-8 rounded-lg object-cover" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white font-semibold">
            {orgName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900 truncate max-w-[140px]">
            {orgName}
          </span>
          <span className="text-xs text-gray-500">Admin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.name}
              href={`${basePath}${item.href}`}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className={cn('h-5 w-5', active ? 'text-green-600' : 'text-gray-400')} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Back to site */}
      <div className="border-t border-gray-200 p-4">
        <Link
          href={`/${orgSlug}`}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← Back to site
        </Link>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-0 left-0 z-50 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="m-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out lg:hidden',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <SidebarContent />
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex h-full flex-col border-r border-gray-200 bg-white">
          <SidebarContent />
        </div>
      </aside>
    </>
  )
}
