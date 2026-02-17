import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient, getOrgBySlugOrDomain, getUser, getOrgMembership } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Course } from "@/lib/supabase/types";

interface CoursesPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function CoursesPage({ params }: CoursesPageProps) {
  const { orgSlug } = await params;

  const org = await getOrgBySlugOrDomain(orgSlug);
  if (!org) notFound();

  const user = await getUser();
  if (!user) redirect(`/login?redirect=/${orgSlug}/admin/courses`);

  const membership = await getOrgMembership(org.id, user.id);
  if (!membership) redirect(`/${orgSlug}/admin`);

  const supabase = await createServerClient();
  const { data: coursesData } = await supabase
    .from("courses")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  const courses = (coursesData ?? []) as Course[];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Courses</h1>
          <p className="text-muted-foreground mt-1">
            Manage your organization&apos;s courses
          </p>
        </div>
        <Button asChild>
          <Link href={`/${orgSlug}/admin/courses/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Link>
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No courses yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first course to get started
            </p>
            <Button asChild>
              <Link href={`/${orgSlug}/admin/courses/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="h-24 w-32 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-24 w-32 rounded-lg bg-muted flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{course.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {course.short_description || course.description || "No description"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(course.status)}>
                          {course.status}
                        </Badge>
                        {course.price > 0 && (
                          <Badge variant="outline">${course.price}</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Created {new Date(course.created_at).toLocaleDateString()}
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/${orgSlug}/courses/${course.slug}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/${orgSlug}/admin/courses/${course.id}`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
