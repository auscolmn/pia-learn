'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { signOut } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import type { AuthUser } from '@/lib/supabase/types'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'

interface UserMenuProps {
  user: AuthUser
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut()
  }

  const initials = user.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email.slice(0, 2).toUpperCase()

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        className="flex items-center gap-2"
        onClick={() => setOpen(!open)}
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={user.fullName ?? user.email}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-700">
            {initials}
          </div>
        )}
        <span className="hidden text-sm font-medium text-gray-700 md:block">
          {user.fullName ?? user.email}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-medium text-gray-900">
              {user.fullName ?? 'User'}
            </p>
            <p className="truncate text-sm text-gray-500">{user.email}</p>
          </div>

          <div className="py-1">
            <MenuLink
              href="/settings/profile"
              icon={<User className="h-4 w-4" />}
              onClick={() => setOpen(false)}
            >
              Your Profile
            </MenuLink>
            <MenuLink
              href="/settings"
              icon={<Settings className="h-4 w-4" />}
              onClick={() => setOpen(false)}
            >
              Settings
            </MenuLink>
          </div>

          <div className="border-t border-gray-100 py-1">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuLink({
  href,
  icon,
  children,
  onClick,
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
      onClick={onClick}
    >
      {icon}
      {children}
    </Link>
  )
}
