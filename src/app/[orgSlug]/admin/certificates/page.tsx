import { notFound, redirect } from "next/navigation";
import { createServerClient, getOrgBySlugOrDomain, getUser, getOrgMembership } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award } from "lucide-react";
import { CertificatesTable } from "./_components/certificates-table";
import { CertificateSearch } from "./_components/certificate-search";
import { IssueCertificateDialog } from "./_components/issue-certificate-dialog";

interface CertificatesPageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ q?: string }>;
}

interface CertificateData {
  id: string;
  certificate_number: string;
  recipient_name: string;
  issued_at: string;
  pdf_url: string | null;
  metadata: Record<string, unknown>;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  course: {
    id: string;
    title: string;
    slug: string;
  };
}

export default async function CertificatesPage({ params, searchParams }: CertificatesPageProps) {
  const { orgSlug } = await params;
  const { q: searchQuery } = await searchParams;

  const org = await getOrgBySlugOrDomain(orgSlug);
  if (!org) notFound();

  const user = await getUser();
  if (!user) redirect(`/login?redirect=/${orgSlug}/admin/certificates`);

  const membership = await getOrgMembership(org.id, user.id);
  if (!membership) redirect(`/${orgSlug}/admin`);

  const supabase = await createServerClient();
  
  // Build query
  let query = supabase
    .from("certificates")
    .select(`
      id,
      certificate_number,
      recipient_name,
      issued_at,
      pdf_url,
      metadata,
      user:users(id, email, full_name, avatar_url),
      course:courses(id, title, slug)
    `)
    .eq("org_id", org.id)
    .order("issued_at", { ascending: false });

  // Apply search filter if present
  if (searchQuery) {
    query = query.or(`recipient_name.ilike.%${searchQuery}%,certificate_number.ilike.%${searchQuery}%`);
  }

  const { data: certificatesData } = await query.limit(100);

  const certificates: CertificateData[] = (certificatesData ?? [])
    .filter((c) => c.user && c.course)
    .map((c) => ({
      ...c,
      metadata: (c.metadata as Record<string, unknown>) || {},
      user: Array.isArray(c.user) ? c.user[0] : c.user,
      course: Array.isArray(c.course) ? c.course[0] : c.course,
    })) as CertificateData[];

  // Get courses and users for manual certificate issuance
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title")
    .eq("org_id", org.id)
    .eq("status", "published")
    .order("title");

  const { data: students } = await supabase
    .from("enrollments")
    .select(`
      user_id,
      user:users(id, email, full_name)
    `)
    .eq("org_id", org.id);

  // De-duplicate students
  const uniqueStudents = students?.reduce((acc, enrollment) => {
    const u = Array.isArray(enrollment.user) ? enrollment.user[0] : enrollment.user;
    if (u && !acc.some(s => s.id === u.id)) {
      acc.push(u);
    }
    return acc;
  }, [] as { id: string; email: string; full_name: string | null }[]) ?? [];

  // Count revoked
  const revokedCount = certificates.filter(c => c.metadata?.revoked === true).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Certificates</h1>
          <p className="text-muted-foreground mt-1">
            {certificates.length} {certificates.length === 1 ? "certificate" : "certificates"} issued
            {revokedCount > 0 && ` (${revokedCount} revoked)`}
          </p>
        </div>
        <IssueCertificateDialog 
          orgId={org.id}
          courses={courses ?? []}
          students={uniqueStudents}
        />
      </div>

      {/* Search */}
      <CertificateSearch defaultValue={searchQuery} />

      {certificates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery ? "No certificates found" : "No certificates issued yet"}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery 
                ? `No certificates matching "${searchQuery}"`
                : "Certificates are automatically generated when students complete courses"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <CertificatesTable 
          certificates={certificates} 
          orgSlug={orgSlug}
        />
      )}
    </div>
  );
}
