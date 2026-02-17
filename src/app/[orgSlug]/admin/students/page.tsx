import { notFound, redirect } from "next/navigation";
import { createServerClient, getOrgBySlugOrDomain, getUser, getOrgMembership } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Search, Mail, Calendar, BookOpen, GraduationCap } from "lucide-react";

interface StudentsPageProps {
  params: Promise<{ orgSlug: string }>;
}

interface StudentEnrollment {
  id: string;
  user_id: string;
  enrolled_at: string;
  progress_percent: number;
  status: string;
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

export default async function StudentsPage({ params }: StudentsPageProps) {
  const { orgSlug } = await params;

  const org = await getOrgBySlugOrDomain(orgSlug);
  if (!org) notFound();

  const user = await getUser();
  if (!user) redirect(`/login?redirect=/${orgSlug}/admin/students`);

  const membership = await getOrgMembership(org.id, user.id);
  if (!membership) redirect(`/${orgSlug}/admin`);

  const supabase = await createServerClient();
  
  // Fetch enrollments with user and course data
  const { data: enrollmentsData } = await supabase
    .from("enrollments")
    .select(`
      id,
      user_id,
      enrolled_at,
      progress_percent,
      status,
      user:users(id, email, full_name, avatar_url),
      course:courses(id, title, slug)
    `)
    .eq("org_id", org.id)
    .order("enrolled_at", { ascending: false });

  // Group by user to get unique students with their enrollments
  const studentsMap = new Map<string, {
    user: StudentEnrollment["user"];
    enrollments: StudentEnrollment[];
    totalCourses: number;
    completedCourses: number;
  }>();

  (enrollmentsData ?? []).forEach((enrollment) => {
    if (!enrollment.user || !enrollment.course) return;
    
    const userData = Array.isArray(enrollment.user) ? enrollment.user[0] : enrollment.user;
    const courseData = Array.isArray(enrollment.course) ? enrollment.course[0] : enrollment.course;
    
    const existing = studentsMap.get(userData.id);
    const enrollmentItem: StudentEnrollment = {
      ...enrollment,
      user: userData,
      course: courseData,
    };

    if (existing) {
      existing.enrollments.push(enrollmentItem);
      existing.totalCourses++;
      if (enrollment.status === "completed") {
        existing.completedCourses++;
      }
    } else {
      studentsMap.set(userData.id, {
        user: userData,
        enrollments: [enrollmentItem],
        totalCourses: 1,
        completedCourses: enrollment.status === "completed" ? 1 : 0,
      });
    }
  });

  const students = Array.from(studentsMap.values());

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
          <h1 className="text-3xl font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground mt-1">
            {students.length} {students.length === 1 ? "student" : "students"} enrolled
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search students..."
          className="pl-10"
        />
      </div>

      {students.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No students yet</h3>
            <p className="text-muted-foreground">
              Students will appear here when they enroll in your courses
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {students.map(({ user: student, totalCourses, completedCourses, enrollments }) => {
                const initials = student.full_name
                  ? student.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : student.email.slice(0, 2).toUpperCase();

                const firstEnrollment = enrollments[0];
                const avgProgress = Math.round(
                  enrollments.reduce((acc, e) => acc + e.progress_percent, 0) / enrollments.length
                );

                return (
                  <div key={student.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={student.avatar_url ?? undefined}
                          alt={student.full_name ?? student.email}
                        />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">
                            {student.full_name ?? student.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {student.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Joined {formatDate(firstEnrollment.enrolled_at)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <BookOpen className="h-4 w-4" />
                            <span className="font-medium text-foreground">{totalCourses}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">Courses</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <GraduationCap className="h-4 w-4" />
                            <span className="font-medium text-foreground">{completedCourses}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">Completed</div>
                        </div>
                        <div className="w-24">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">Progress</span>
                            <span className="text-xs font-medium">{avgProgress}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${avgProgress}%` }}
                            />
                          </div>
                        </div>
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
