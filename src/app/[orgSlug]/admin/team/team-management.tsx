"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Organization, OrgMemberWithUser, OrgMemberRole } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  UserPlus,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  UserMinus,
  Loader2,
  Mail,
  Calendar,
} from "lucide-react";

interface TeamManagementProps {
  org: Organization;
  members: OrgMemberWithUser[];
  currentUserId: string;
}

export function TeamManagement({ org, members, currentUserId }: TeamManagementProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrgMemberRole>("instructor");
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();

        // First, check if user exists
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("email", inviteEmail.toLowerCase())
          .single();

        if (!existingUser) {
          // In production, you'd send an invite email here
          // For now, show a message that user needs to sign up first
          toast.error("User not found. They need to create an account first.");
          return;
        }

        // Check if already a member
        const { data: existingMember } = await supabase
          .from("org_members")
          .select("id")
          .eq("org_id", org.id)
          .eq("user_id", existingUser.id)
          .single();

        if (existingMember) {
          toast.error("This user is already a member of this organization");
          return;
        }

        // Add member
        const { error } = await supabase.from("org_members").insert({
          org_id: org.id,
          user_id: existingUser.id,
          role: inviteRole,
          invited_by: currentUserId,
        });

        if (error) {
          toast.error("Failed to add team member: " + error.message);
          return;
        }

        toast.success(`${inviteEmail} has been added as ${inviteRole}`);
        setInviteOpen(false);
        setInviteEmail("");
        router.refresh();
      } catch (err) {
        toast.error("An unexpected error occurred");
        console.error(err);
      }
    });
  };

  const handleRoleChange = async (memberId: string, newRole: OrgMemberRole) => {
    startTransition(async () => {
      try {
        const supabase = createClient();

        const { error } = await supabase
          .from("org_members")
          .update({ role: newRole })
          .eq("id", memberId);

        if (error) {
          toast.error("Failed to update role: " + error.message);
          return;
        }

        toast.success("Role updated successfully");
        router.refresh();
      } catch (err) {
        toast.error("An unexpected error occurred");
        console.error(err);
      }
    });
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from the team?`)) {
      return;
    }

    setRemovingMemberId(memberId);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("org_members")
        .delete()
        .eq("id", memberId);

      if (error) {
        toast.error("Failed to remove member: " + error.message);
        return;
      }

      toast.success(`${memberEmail} has been removed from the team`);
      router.refresh();
    } catch (err) {
      toast.error("An unexpected error occurred");
      console.error(err);
    } finally {
      setRemovingMemberId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-AU", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Invite button */}
      <div className="flex justify-end">
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Team Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Add a new admin or instructor to your organization.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant={inviteRole === "instructor" ? "default" : "outline"}
                      onClick={() => setInviteRole("instructor")}
                      className="flex-1"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Instructor
                    </Button>
                    <Button
                      type="button"
                      variant={inviteRole === "admin" ? "default" : "outline"}
                      onClick={() => setInviteRole("admin")}
                      className="flex-1"
                    >
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {inviteRole === "admin"
                      ? "Admins can manage team members, billing, and organization settings."
                      : "Instructors can create and manage courses."}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInviteOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Member
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team members list */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {members.length} {members.length === 1 ? "member" : "members"} in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {members.map((member) => {
              const user = member.user;
              const isCurrentUser = user.id === currentUserId;
              const initials = user.full_name
                ? user.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : user.email.slice(0, 2).toUpperCase();

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user.avatar_url ?? undefined}
                        alt={user.full_name ?? user.email}
                      />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {user.full_name ?? user.email}
                        </p>
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Joined {formatDate(member.joined_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant={member.role === "admin" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {member.role === "admin" ? (
                        <ShieldCheck className="h-3 w-3 mr-1" />
                      ) : (
                        <Shield className="h-3 w-3 mr-1" />
                      )}
                      {member.role}
                    </Badge>

                    {!isCurrentUser && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={removingMemberId === member.id}
                          >
                            {removingMemberId === member.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              handleRoleChange(
                                member.id,
                                member.role === "admin" ? "instructor" : "admin"
                              )
                            }
                            disabled={isPending}
                          >
                            {member.role === "admin" ? (
                              <>
                                <Shield className="h-4 w-4 mr-2" />
                                Change to Instructor
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                Make Admin
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handleRemoveMember(member.id, user.email)
                            }
                            className="text-destructive"
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove from Team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Role descriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Admin</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-7">
                <li>• Manage team members</li>
                <li>• Access billing & settings</li>
                <li>• View all analytics</li>
                <li>• Create and manage courses</li>
                <li>• Manage students</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-secondary" />
                <h4 className="font-medium">Instructor</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-7">
                <li>• Create and manage their courses</li>
                <li>• View their course analytics</li>
                <li>• Manage enrollments for their courses</li>
                <li>• Issue certificates</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
