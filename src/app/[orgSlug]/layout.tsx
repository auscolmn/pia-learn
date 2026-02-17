import { notFound, redirect } from "next/navigation";
import { getOrgBySlugOrDomain, getUser, getOrgMembership } from "@/lib/supabase/server";
import { OrgProvider } from "@/components/providers/org-provider";
import { OrgDashboardShell } from "@/components/org/org-dashboard-shell";
import type { Organization, OrgMember } from "@/lib/supabase/types";

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { orgSlug } = await params;

  // Fetch organization by slug
  const org = await getOrgBySlugOrDomain(orgSlug);

  if (!org) {
    notFound();
  }

  // Get current user
  const user = await getUser();

  if (!user) {
    // Redirect to login with callback
    redirect(`/login?redirect=/${orgSlug}/admin`);
  }

  // Check membership
  const membership = await getOrgMembership(org.id, user.id);

  // For now, allow public access to org pages (catalog, etc.)
  // Admin routes will have additional auth checks

  return (
    <OrgProvider
      orgSlug={orgSlug}
      initialOrg={org}
      initialMembership={membership}
    >
      <OrgDashboardShell
        org={org}
        user={user}
        membership={membership}
      >
        {children}
      </OrgDashboardShell>
    </OrgProvider>
  );
}

// Generate metadata dynamically based on org
export async function generateMetadata({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const org = await getOrgBySlugOrDomain(orgSlug);

  if (!org) {
    return {
      title: "Organization Not Found | LearnStudio",
    };
  }

  return {
    title: `${org.name} | LearnStudio`,
    description: org.description || `Welcome to ${org.name} on LearnStudio`,
  };
}
