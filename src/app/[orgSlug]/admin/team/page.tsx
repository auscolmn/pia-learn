import { notFound, redirect } from "next/navigation";
import { createServerClient, getOrgBySlugOrDomain, getUser, getOrgMembership } from "@/lib/supabase/server";
import { TeamManagement } from "./team-management";
import type { OrgMemberWithUser } from "@/lib/supabase/types";

interface TeamPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { orgSlug } = await params;

  // Fetch org
  const org = await getOrgBySlugOrDomain(orgSlug);
  if (!org) notFound();

  // Check user has admin access
  const user = await getUser();
  if (!user) redirect(`/login?redirect=/${orgSlug}/admin/team`);

  const membership = await getOrgMembership(org.id, user.id);
  if (!membership || membership.role !== "admin") {
    redirect(`/${orgSlug}/admin`);
  }

  // Fetch team members
  const supabase = await createServerClient();
  const { data: membersData } = await supabase
    .from("org_members")
    .select(`
      *,
      user:users(*)
    `)
    .eq("org_id", org.id)
    .order("created_at", { ascending: true });

  const members: OrgMemberWithUser[] = (membersData ?? [])
    .filter((m): m is typeof m & { user: NonNullable<typeof m.user> } => m.user !== null)
    .map((m) => ({
      ...m,
      user: Array.isArray(m.user) ? m.user[0] : m.user,
    }));

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Team</h1>
        <p className="text-muted-foreground mt-1">
          Manage your organization&apos;s team members
        </p>
      </div>

      <TeamManagement
        org={org}
        members={members}
        currentUserId={user.id}
      />
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const org = await getOrgBySlugOrDomain(orgSlug);

  return {
    title: `Team | ${org?.name ?? "Organization"} | LearnStudio`,
  };
}
