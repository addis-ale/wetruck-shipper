"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [hasLocalUser, setHasLocalUser] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasLocalUser(!!localStorage.getItem("wetruck_user"));
    }
  }, []);

  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated
    if (!isLoading && !isAuthenticated && !hasLocalUser) {
      router.replace("/sign-in");
    }
  }, [isLoading, isAuthenticated, hasLocalUser, router]);

  // Show loading only during initial auth check
  if (isLoading && !hasLocalUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user exists in localStorage but isAuthenticated is false, show content anyway
  // This handles the case where we just logged in and state is updating
  // The auth state will catch up shortly
  if (!isAuthenticated && hasLocalUser) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

