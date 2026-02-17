import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap, Home, Search } from "lucide-react";

export default function OrgNotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
            <GraduationCap className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-2">Organization Not Found</h1>
        <p className="text-muted-foreground mb-8">
          We couldn&apos;t find the organization you&apos;re looking for. 
          It may have been moved or doesn&apos;t exist.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/pricing">
              <Search className="h-4 w-4 mr-2" />
              Create Organization
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
