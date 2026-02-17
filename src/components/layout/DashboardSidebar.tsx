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
  CreditCard,
  Palette,
  FileText,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const adminNav: NavItem[] = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Courses", href: "/admin/courses", icon: BookOpen },
  { name: "Students", href: "/admin/students", icon: Users },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Certificates", href: "/admin/certificates", icon: FileText },
];

const settingsNav: NavItem[] = [
  { name: "Branding", href: "/admin/settings/branding", icon: Palette },
  { name: "Billing", href: "/admin/settings/billing", icon: CreditCard },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

interface DashboardSidebarProps {
  orgName?: string;
  orgLogo?: string;
}

export function DashboardSidebar({ orgName = "Your Organization" }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

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

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <span className="text-sm font-semibold truncate">{orgName}</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {adminNav.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </div>

          <div className="mt-8">
            {!collapsed && (
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Settings
              </p>
            )}
            <div className="space-y-1">
              {settingsNav.map((item) => (
                <NavLink key={item.name} item={item} />
              ))}
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
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
            className={cn(
              "mt-2 w-full",
              collapsed && "px-0"
            )}
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
  );
}
