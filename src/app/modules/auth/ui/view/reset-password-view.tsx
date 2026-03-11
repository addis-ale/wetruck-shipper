"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ResetPasswordForm } from "../components/reset-password-form";

export function ResetPasswordView() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8">
      <Card className="w-full max-w-md border-none shadow-none sm:border sm:shadow-sm bg-white">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">
            Reset Password
          </h2>
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
