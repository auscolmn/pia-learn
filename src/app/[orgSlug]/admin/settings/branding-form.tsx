"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Organization } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  Palette,
  Code,
  Eye,
  Save,
  Loader2,
  GraduationCap,
  X,
} from "lucide-react";

// Add Textarea import if not already in components
// We'll create it inline if needed

interface BrandingSettingsFormProps {
  org: Organization;
}

export function BrandingSettingsForm({ org }: BrandingSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [logoUrl, setLogoUrl] = useState(org.logo_url ?? "");
  const [primaryColor, setPrimaryColor] = useState(org.primary_color ?? "#6366F1");
  const [secondaryColor, setSecondaryColor] = useState(org.secondary_color ?? "#818CF8");
  const [customCss, setCustomCss] = useState(org.custom_css ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setLogoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setLogoUrl("");
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const supabase = createClient();
        let finalLogoUrl = logoUrl;

        // Upload logo if new file selected
        if (logoFile) {
          const fileExt = logoFile.name.split(".").pop();
          const fileName = `${org.id}/logo-${Date.now()}.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("org-assets")
            .upload(fileName, logoFile, {
              cacheControl: "3600",
              upsert: true,
            });

          if (uploadError) {
            toast.error("Failed to upload logo: " + uploadError.message);
            return;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from("org-assets")
            .getPublicUrl(fileName);

          finalLogoUrl = urlData.publicUrl;
        }

        // Update organization
        const { error: updateError } = await supabase
          .from("organizations")
          .update({
            logo_url: finalLogoUrl || null,
            primary_color: primaryColor,
            secondary_color: secondaryColor,
            custom_css: customCss || null,
          })
          .eq("id", org.id);

        if (updateError) {
          toast.error("Failed to save settings: " + updateError.message);
          return;
        }

        toast.success("Branding settings saved!");
        router.refresh();
      } catch (err) {
        toast.error("An unexpected error occurred");
        console.error(err);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Logo Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Logo
          </CardTitle>
          <CardDescription>
            Upload your organization&apos;s logo. Recommended size: 256x256px
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-6">
            {/* Logo preview */}
            <div className="flex-shrink-0">
              {logoPreview || logoUrl ? (
                <div className="relative">
                  <img
                    src={logoPreview ?? logoUrl}
                    alt="Logo preview"
                    className="h-24 w-24 rounded-lg object-cover border border-border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={clearLogo}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="h-24 w-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted">
                  <GraduationCap className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Upload input */}
            <div className="flex-1 space-y-2">
              <Label htmlFor="logo">Upload Logo</Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                PNG, JPG, or SVG. Max 2MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Colors Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Brand Colors
          </CardTitle>
          <CardDescription>
            Set your primary and secondary brand colors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Primary color */}
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-3">
                <div className="relative">
                  <input
                    type="color"
                    id="primaryColor"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-border p-1"
                  />
                </div>
                <Input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#6366F1"
                  className="flex-1 font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Used for buttons, links, and accents
              </p>
            </div>

            {/* Secondary color */}
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex gap-3">
                <div className="relative">
                  <input
                    type="color"
                    id="secondaryColor"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-border p-1"
                  />
                </div>
                <Input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#818CF8"
                  className="flex-1 font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Used for highlights and secondary elements
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview
          </CardTitle>
          <CardDescription>See how your branding will look</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-4 mb-6">
              {logoPreview || logoUrl ? (
                <img
                  src={logoPreview ?? logoUrl}
                  alt="Logo"
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <div
                  className="h-12 w-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <h3 className="font-semibold">{org.name}</h3>
                <p className="text-sm text-muted-foreground">Your Learning Platform</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                style={{ backgroundColor: primaryColor }}
                className="hover:opacity-90"
              >
                Primary Button
              </Button>
              <Button
                type="button"
                variant="outline"
                style={{
                  borderColor: primaryColor,
                  color: primaryColor,
                }}
              >
                Outline Button
              </Button>
              <Button
                type="button"
                style={{ backgroundColor: secondaryColor }}
                className="hover:opacity-90"
              >
                Secondary Button
              </Button>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <div
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: primaryColor }}
              />
              <span style={{ color: primaryColor }} className="font-medium">
                Primary text color
              </span>
            </div>
            <div className="mt-2 flex items-center gap-4">
              <div
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: secondaryColor }}
              />
              <span style={{ color: secondaryColor }} className="font-medium">
                Secondary text color
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom CSS Section (Advanced) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Custom CSS
            <span className="text-xs font-normal text-muted-foreground ml-2">
              (Advanced)
            </span>
          </CardTitle>
          <CardDescription>
            Add custom CSS to further customize your organization&apos;s appearance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="customCss">CSS Code</Label>
            <textarea
              id="customCss"
              value={customCss}
              onChange={(e) => setCustomCss(e.target.value)}
              placeholder={`/* Custom CSS */
.your-class {
  /* your styles */
}`}
              className="w-full min-h-[200px] p-3 font-mono text-sm rounded-lg border border-border bg-muted resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              Use CSS custom properties like <code className="bg-muted px-1 rounded">--primary</code> and{" "}
              <code className="bg-muted px-1 rounded">--secondary</code> for consistency.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit button */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
