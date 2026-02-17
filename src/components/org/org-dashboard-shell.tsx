"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  BarChart3,
  FileText,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Palette,
  UserCog,
  LogOut,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import type { Organization, OrgMember, AuthUser } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

interface OrgDashboardShellProps {
  children: React.ReactNode;
  org: Organization;
  user: AuthUser;
  membership: OrgMember | null;
}

export function OrgDashboardShell({
  children,
  org,
  user,
  membership,
}: OrgDashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  
  const isAdmin = membership?.role === "admin";
  const isInstructor = membership?.role === "instructor";
  const isMember = isAdmin || isInstructor;

  // Build nav based on org slug
  const baseHref = `/${org.slug}`;

  const mainNav: NavItem[] = [
    { name: "Dashboard", href: `${baseHref}/admin`, icon: LayoutDashboard, adminOnly: false },
    { name: "Courses", href: `${baseHref}/admin/courses`, icon: BookOpen },
    { name: "Students", href: `${baseHref}/admin/students`, icon: Users },
    { name: "Analytics", href: `${baseHref}/admin/analytics`, icon: BarChart3, adminOnly: true },
    { name: "Certificates", href: `${baseHref}/admin/certificates`, icon: FileText },
  ];

  const settingsNav: NavItem[] = [
    { name: "Branding", href: `${baseHref}/admin/settings`, icon: Palette, adminOnly: true },
    { name: "Team", href: `${baseHref}/admin/team`, icon: UserCog, adminOnly: true },
    { name: "Settings", href: `${baseHref}/admin/settings/general`, icon: Settings, adminOnly: true },
  ];

  // Filter nav items based on role
  const filteredMainNav = mainNav.filter(
    (item) => !item.adminOnly || isAdmin
  );
  const filteredSettingsNav = settingsNav.filter(
    (item) => !item.adminOnly || isAdmin
  );

  const initials = user.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
        title={collapsed ? item.name : undefined}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        {!collapsed && <span>{item.name}</span>}
      </Link>
    );
  };

  // If not a member, show restricted view
  if (!isMember) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Restricted</h1>
          <p className="text-muted-foreground mb-4">
            You don&apos;t have access to this organization&apos;s admin area.
          </p>
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header with org logo/name */}
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <Link href={`${baseHref}/admin`} className="flex items-center gap-2">
              {org.logo_url ? (
                <img
                  src={org.logo_url}
                  alt={org.name}
                  className="h-8 w-8 rounded-lg object-cover"
                />
              ) : (
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: org.primary_color || "#6366F1" }}
                >
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
              )}
              {!collapsed && (
                <span className="text-sm font-semibold truncate">{org.name}</span>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            {/* Main nav */}
            <div className="space-y-1">
              {filteredMainNav.map((item) => (
                <NavLink key={item.name} item={item} />
              ))}
            </div>

            {/* Settings section */}
            {filteredSettingsNav.length > 0 && (
              <div className="mt-8">
                {!collapsed && (
                  <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Settings
                  </p>
                )}
                <div className="space-y-1">
                  {filteredSettingsNav.map((item) => (
                    <NavLink key={item.name} item={item} />
                  ))}
                </div>
              </div>
            )}
          </nav>

          {/* Footer */}
          <div className="border-t border-border p-4">
            {/* Public site link */}
            <Link
              href={baseHref}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mb-2",
                collapsed && "justify-center"
              )}
            >
              <Home className="h-5 w-5 shrink-0" />
              {!collapsed && <span>View Public Site</span>}
            </Link>

            <Link
              href="/help"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
                collapsed && "justify-center"
              )}
            >
              <HelpCircle className="h-5 w-5 shrink-0" />
              {!collapsed && <span>Help & Support</span>}
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className={cn("mt-2 w-full", collapsed && "px-0")}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Collapse
                </>
              )}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div
        className={cn(
          "transition-all duration-300",
          collapsed ? "pl-16" : "pl-64"
        )}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6">
          {/* Search */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search courses, students..."
              className="pl-10 bg-muted border-0"
            />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cta text-[10px] font-bold text-white">
                3
              </span>
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatarUrl ?? undefined} alt={user.fullName ?? user.email} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.fullName ?? "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      {membership?.role ?? "Member"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">My Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive cursor-pointer"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
