import { redirect } from 'next/navigation'
import { getUser, getOrgBySlugOrDomain, getOrgMembership } from '@/lib/supabase/server'
import { AdminSidebar } from './_components/admin-sidebar'
import { AdminHeader } from './_components/admin-header'
import type { Organization, OrgMemberRole } from '@/lib/supabase/types'

interface AdminLayoutProps {
  children: React.ReactNode
  params: Promise<{ orgSlug: string }>
}

export interface AdminContextValue {
  org: Organization
  role: OrgMemberRole
  userName: string
  userEmail: string
  userAvatar?: string
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { orgSlug } = await params
  
  // Get current user
  const user = await getUser()
  if (!user) {
    redirect(`/login?redirect=/${orgSlug}/admin`)
  }

  // Get organization
  const org = await getOrgBySlugOrDomain(orgSlug)
  if (!org) {
    redirect('/dashboard')
  }

  // Check membership
  const membership = await getOrgMembership(org.id, user.id)
  if (!membership && !user.isPlatformAdmin) {
    redirect(`/${orgSlug}`)
  }

  const role = user.isPlatformAdmin ? 'admin' : membership!.role

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar 
        orgSlug={orgSlug} 
        orgName={org.name}
        orgLogo={org.logo_url}
      />
      
      <div className="lg:pl-64">
        <AdminHeader 
          userName={user.fullName ?? user.email}
          userEmail={user.email}
          userAvatar={user.avatarUrl ?? undefined}
          orgName={org.name}
        />
        
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
