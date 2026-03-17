"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { forgotPasswordSchema } from "@/lib/zod/auth.schema";
import { z } from "zod";
import { Mail, Loader2, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRequestPasswordReset } from "../../server/hooks/use-request-password-reset";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

type FormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const mutation = useRequestPasswordReset();
  const router = useRouter();
  const { t } = useTranslation("auth");

  const form = useForm<FormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: FormData) => {
    await mutation.mutateAsync(data.email);
  };

  // ✅ Auto redirect after OTP sent
  useEffect(() => {
    if (mutation.isSuccess) {
      const timer = setTimeout(() => {
        router.push("/reset-password");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [mutation.isSuccess, router]);

  if (mutation.isSuccess) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-sm text-green-700">
          {t("forgot_password.success")}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {t("forgot_password.email_label")} <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder={t("forgot_password.email_placeholder")}
            {...form.register("email")}
            className="pl-9"
          />
        </div>
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      {mutation.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {(mutation.error as Error).message}
          </AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("forgot_password.sending")}
          </>
        ) : (
          t("forgot_password.send_otp")
        )}
      </Button>
    </form>
  );
}
