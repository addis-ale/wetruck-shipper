"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ForgotPasswordForm } from "../components/forgot-password-form";

export function ForgotPasswordView() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-bold">Forgot Password</h2>
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
