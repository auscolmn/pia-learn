import { notFound, redirect } from "next/navigation";
import { createServerClient, getOrgBySlugOrDomain, getUser, getOrgMembership } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileText, Search, Download, ExternalLink, Calendar, Award } from "lucide-react";

interface CertificatesPageProps {
  params: Promise<{ orgSlug: string }>;
}

interface CertificateData {
  id: string;
  certificate_number: string;
  recipient_name: string;
  issued_at: string;
  pdf_url: string | null;
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

export default async function CertificatesPage({ params }: CertificatesPageProps) {
  const { orgSlug } = await params;

  const org = await getOrgBySlugOrDomain(orgSlug);
  if (!org) notFound();

  const user = await getUser();
  if (!user) redirect(`/login?redirect=/${orgSlug}/admin/certificates`);

  const membership = await getOrgMembership(org.id, user.id);
  if (!membership) redirect(`/${orgSlug}/admin`);

  const supabase = await createServerClient();
  
  const { data: certificatesData } = await supabase
    .from("certificates")
    .select(`
      id,
      certificate_number,
      recipient_name,
      issued_at,
      pdf_url,
      user:users(id, email, full_name, avatar_url),
      course:courses(id, title, slug)
    `)
    .eq("org_id", org.id)
    .order("issued_at", { ascending: false });

  const certificates: CertificateData[] = (certificatesData ?? [])
    .filter((c) => c.user && c.course)
    .map((c) => ({
      ...c,
      user: Array.isArray(c.user) ? c.user[0] : c.user,
      course: Array.isArray(c.course) ? c.course[0] : c.course,
    })) as CertificateData[];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-AU", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Certificates</h1>
          <p className="text-muted-foreground mt-1">
            {certificates.length} {certificates.length === 1 ? "certificate" : "certificates"} issued
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by name or certificate number..."
          className="pl-10"
        />
      </div>

      {certificates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No certificates issued yet</h3>
            <p className="text-muted-foreground">
              Certificates are automatically generated when students complete courses
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {certificates.map((certificate) => {
                const initials = certificate.user.full_name
                  ? certificate.user.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : certificate.user.email.slice(0, 2).toUpperCase();

                return (
                  <div key={certificate.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={certificate.user.avatar_url ?? undefined}
                          alt={certificate.recipient_name}
                        />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{certificate.recipient_name}</p>
                          <Badge variant="outline" className="font-mono text-xs">
                            {certificate.certificate_number}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>{certificate.course.title}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(certificate.issued_at)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {certificate.pdf_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={certificate.pdf_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </a>
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={`/verify/${certificate.certificate_number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Verify
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
