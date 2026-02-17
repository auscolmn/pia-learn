import { notFound, redirect } from "next/navigation";
import { getOrgBySlugOrDomain, getUser, getOrgMembership } from "@/lib/supabase/server";
import { BrandingSettingsForm } from "./branding-form";

interface SettingsPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function BrandingSettingsPage({ params }: SettingsPageProps) {
  const { orgSlug } = await params;

  // Fetch org
  const org = await getOrgBySlugOrDomain(orgSlug);
  if (!org) notFound();

  // Check user has admin access
  const user = await getUser();
  if (!user) redirect(`/login?redirect=/${orgSlug}/admin/settings`);

  const membership = await getOrgMembership(org.id, user.id);
  if (!membership || membership.role !== "admin") {
    redirect(`/${orgSlug}/admin`);
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Branding</h1>
        <p className="text-muted-foreground mt-1">
          Customize your organization&apos;s look and feel
        </p>
      </div>

      <BrandingSettingsForm org={org} />
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const org = await getOrgBySlugOrDomain(orgSlug);

  return {
    title: `Branding Settings | ${org?.name ?? "Organization"} | LearnStudio`,
  };
}
