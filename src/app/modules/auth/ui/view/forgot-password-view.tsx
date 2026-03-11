"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ForgotPasswordForm } from "../components/forgot-password-form";

export function ForgotPasswordView() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-4 sm:px-6 py-6 sm:py-8">
      <div className="w-full max-w-[400px] sm:max-w-md mx-auto">
        <Card className="w-full overflow-hidden border-none shadow-none sm:border sm:shadow-sm bg-white">
          <CardContent className="p-5 sm:p-6 space-y-5">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium -ml-0.5"
              aria-label="Back to Sign In"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
              Back to Sign In
            </Link>
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">
                Forgot Password
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your email and we&apos;ll send you a link to reset your
                password.
              </p>
            </div>
            <ForgotPasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
