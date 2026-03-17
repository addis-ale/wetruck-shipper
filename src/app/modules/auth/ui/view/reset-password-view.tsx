"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ResetPasswordForm } from "../components/reset-password-form";
import { useTranslation } from "react-i18next";

export function ResetPasswordView() {
  const { t } = useTranslation("auth");

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-bold">{t("reset_password.title")}</h2>
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
