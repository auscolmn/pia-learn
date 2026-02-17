"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { Organization, OrgMember, OrgMemberRole } from "@/lib/supabase/types";

interface OrgContextValue {
  org: Organization | null;
  membership: OrgMember | null;
  role: OrgMemberRole | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const OrgContext = createContext<OrgContextValue | null>(null);

interface OrgProviderProps {
  children: ReactNode;
  orgSlug: string;
  initialOrg?: Organization | null;
  initialMembership?: OrgMember | null;
}

/**
 * Applies org branding as CSS custom properties.
 * Falls back to default LearnStudio theme if values not set.
 */
function applyOrgBranding(org: Organization | null) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  if (!org) {
    // Reset to defaults
    root.style.removeProperty("--org-primary");
    root.style.removeProperty("--org-secondary");
    root.style.removeProperty("--org-logo");
    return;
  }

  // Apply org colors as CSS variables
  if (org.primary_color) {
    root.style.setProperty("--org-primary", org.primary_color);
    // Also override the global primary for full theming
    root.style.setProperty("--primary", org.primary_color);
  }

  if (org.secondary_color) {
    root.style.setProperty("--org-secondary", org.secondary_color);
    root.style.setProperty("--secondary", org.secondary_color);
  }

  // Apply custom CSS if present (sanitized on server)
  if (org.custom_css) {
    let styleEl = document.getElementById("org-custom-css");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "org-custom-css";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = org.custom_css;
  } else {
    const existing = document.getElementById("org-custom-css");
    if (existing) existing.remove();
  }
}

export function OrgProvider({
  children,
  orgSlug,
  initialOrg = null,
  initialMembership = null,
}: OrgProviderProps) {
  const [org, setOrg] = useState<Organization | null>(initialOrg);
  const [membership, setMembership] = useState<OrgMember | null>(initialMembership);
  const [isLoading, setIsLoading] = useState(!initialOrg);
  const [error, setError] = useState<string | null>(null);

  const fetchOrg = useCallback(async () => {
    if (!orgSlug) {
      setOrg(null);
      setMembership(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Fetch organization by slug
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("slug", orgSlug)
        .single();

      if (orgError || !orgData) {
        setError("Organization not found");
        setOrg(null);
        setMembership(null);
        setIsLoading(false);
        return;
      }

      setOrg(orgData as Organization);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Fetch membership
        const { data: memberData } = await supabase
          .from("org_members")
          .select("*")
          .eq("org_id", orgData.id)
          .eq("user_id", user.id)
          .single();

        setMembership(memberData as OrgMember | null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load organization");
    } finally {
      setIsLoading(false);
    }
  }, [orgSlug]);

  // Fetch org data on mount (if not provided initially)
  useEffect(() => {
    if (!initialOrg) {
      fetchOrg();
    }
  }, [fetchOrg, initialOrg]);

  // Apply branding when org changes
  useEffect(() => {
    applyOrgBranding(org);

    // Cleanup on unmount
    return () => {
      applyOrgBranding(null);
    };
  }, [org]);

  const value: OrgContextValue = {
    org,
    membership,
    role: membership?.role ?? null,
    isLoading,
    error,
    refetch: fetchOrg,
  };

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

/**
 * Hook to access current organization context.
 * Must be used within OrgProvider.
 */
export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error("useOrg must be used within an OrgProvider");
  }
  return context;
}

/**
 * Hook to require org admin access.
 * Returns org context and throws if user is not an admin.
 */
export function useOrgAdmin() {
  const context = useOrg();

  if (context.isLoading) {
    return { ...context, isAdmin: false };
  }

  if (!context.membership || context.role !== "admin") {
    return { ...context, isAdmin: false };
  }

  return { ...context, isAdmin: true };
}

/**
 * Hook to check if user has any org access (admin or instructor).
 */
export function useOrgMember() {
  const context = useOrg();

  if (context.isLoading) {
    return { ...context, isMember: false };
  }

  return { ...context, isMember: !!context.membership };
}
