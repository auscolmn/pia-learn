import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrgBySlugOrDomain, createServerClient, getUser, getOrgMembership } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, BookOpen, Users, ArrowRight, Settings } from "lucide-react";
import type { Course } from "@/lib/supabase/types";

interface OrgPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function OrgPublicPage({ params }: OrgPageProps) {
  const { orgSlug } = await params;

  // Fetch organization
  const org = await getOrgBySlugOrDomain(orgSlug);
  if (!org) notFound();

  // Check if current user is a member (to show admin link)
  const user = await getUser();
  let isMember = false;
  if (user) {
    const membership = await getOrgMembership(org.id, user.id);
    isMember = !!membership;
  }

  // Fetch published courses
  const supabase = await createServerClient();
  const { data: coursesData } = await supabase
    .from("courses")
    .select("*")
    .eq("org_id", org.id)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(6);

  const courses = (coursesData ?? []) as Course[];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/${orgSlug}`} className="flex items-center gap-3">
            {org.logo_url ? (
              <img
                src={org.logo_url}
                alt={org.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: org.primary_color }}
              >
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
            )}
            <span className="text-xl font-bold">{org.name}</span>
          </Link>

          <div className="flex items-center gap-3">
            {isMember && (
              <Button variant="outline" asChild>
                <Link href={`/${orgSlug}/admin`}>
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Link>
              </Button>
            )}
            {user ? (
              <Button asChild>
                <Link href="/dashboard">My Learning</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="py-20 px-4"
        style={{
          background: `linear-gradient(135deg, ${org.primary_color}10 0%, ${org.secondary_color}10 100%)`,
        }}
      >
        <div className="container mx-auto text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Welcome to {org.name}
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            {org.description || "Explore our courses and start learning today."}
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href={`/${orgSlug}/courses`}>
                <BookOpen className="h-5 w-5 mr-2" />
                Browse Courses
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Our Courses</h2>
              <p className="text-muted-foreground">
                Start your learning journey with these courses
              </p>
            </div>
            {courses.length > 0 && (
              <Button variant="outline" asChild>
                <Link href={`/${orgSlug}/courses`}>
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            )}
          </div>

          {courses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No courses yet</h3>
                <p className="text-muted-foreground">
                  Check back soon for new courses!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-48 flex items-center justify-center"
                      style={{ backgroundColor: `${org.primary_color}20` }}
                    >
                      <BookOpen className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                      {course.price > 0 ? (
                        <Badge variant="secondary">
                          ${course.price}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Free</Badge>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {course.short_description || course.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" asChild>
                      <Link href={`/${orgSlug}/courses/${course.slug}`}>
                        View Course
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8 px-4 mt-auto">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {org.name}. Powered by{" "}
            <Link href="/" className="text-primary hover:underline">
              LearnStudio
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
