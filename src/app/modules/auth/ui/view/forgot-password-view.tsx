"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ForgotPasswordForm } from "../components/forgot-password-form";
import { useTranslation } from "react-i18next";

export function ForgotPasswordView() {
  const { t } = useTranslation("auth");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 py-6 sm:py-8">
      <div className="w-full max-w-[400px] sm:max-w-md mx-auto">
        <Card className="w-full overflow-hidden border-none shadow-none sm:border sm:shadow-sm bg-white">
          <CardContent className="p-5 sm:p-6 space-y-5">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium -ml-0.5"
              aria-label={t("forgot_password.back_to_sign_in")}
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
              {t("forgot_password.back_to_sign_in")}
            </Link>
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">
                {t("forgot_password.title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("forgot_password.subtitle")}
              </p>
            </div>
            <ForgotPasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
