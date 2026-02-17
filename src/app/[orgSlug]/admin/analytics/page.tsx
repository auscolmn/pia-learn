import { notFound, redirect } from "next/navigation";
import { getOrgBySlugOrDomain, getUser, getOrgMembership } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, BookOpen, DollarSign, Clock } from "lucide-react";

interface AnalyticsPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { orgSlug } = await params;

  const org = await getOrgBySlugOrDomain(orgSlug);
  if (!org) notFound();

  const user = await getUser();
  if (!user) redirect(`/login?redirect=/${orgSlug}/admin/analytics`);

  const membership = await getOrgMembership(org.id, user.id);
  if (!membership || membership.role !== "admin") {
    redirect(`/${orgSlug}/admin`);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Track your organization&apos;s performance
        </p>
      </div>

      {/* Placeholder stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrollment Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12%</div>
            <p className="text-xs text-muted-foreground">vs last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14 days</div>
            <p className="text-xs text-muted-foreground">Per course</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">Active learners</p>
          </CardContent>
        </Card>
      </div>

      {/* Coming soon placeholder */}
      <Card>
        <CardContent className="py-16 text-center">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-medium mb-2">Detailed Analytics Coming Soon</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            We&apos;re building comprehensive analytics including enrollment trends, 
            student progress, revenue reports, and course performance metrics.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
