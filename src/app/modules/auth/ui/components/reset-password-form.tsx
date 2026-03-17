"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useConfirmPasswordReset } from "../../server/hooks/use-confirm-password-reset";
import { useTranslation } from "react-i18next";


const passwordSchema = z
  .object({
    code: z.string().min(1, "Reset code is required"),
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type FormData = z.infer<typeof passwordSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const mutation = useConfirmPasswordReset();
  const { t } = useTranslation("auth");

  const [step, setStep] = useState<"otp" | "password">("otp");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      code: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const { errors } = form.formState;
  const onSubmit = async (data: FormData) => {
    await mutation.mutateAsync({
      code: data.code,
      new_password: data.new_password,
    });
  };

  useEffect(() => {
    if (mutation.isSuccess) {
      const timer = setTimeout(() => {
        router.push("/sign-in");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [mutation.isSuccess, router]);

  /* ------------------ Success UI ------------------ */
  if (mutation.isSuccess) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-sm text-green-700">
          {t("reset_password.success")}
        </AlertDescription>
      </Alert>
    );
  }

  /* ------------------ Error UI ------------------ */
  const apiError = mutation.error
    ? (mutation.error as Error).message
    : null;

  /* ------------------ Render ------------------ */
  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
    >
      {/* ---------------- OTP STEP ---------------- */}
      {step === "otp" && (
        <>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {t("reset_password.otp_label")} <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder={t("reset_password.otp_placeholder")}
              {...form.register("code")}
            />
            <p className="text-xs text-muted-foreground">
              {t("reset_password.otp_hint")}
            </p>
            {errors.code && (
              <p className="text-xs text-red-600">
                {errors.code.message}
              </p>
            )}
          </div>

          <Button
            type="button"
            className="w-full"
            onClick={() => setStep("password")}
            disabled={!form.watch("code")}
          >
            <KeyRound className="mr-2 h-4 w-4" />
            {t("reset_password.verify_code")}
          </Button>
        </>
      )}


      {step === "password" && (
        <>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {t("reset_password.new_password_label")} <span className="text-destructive">*</span>
            </label>
            <Input
              type={showNew ? "text" : "password"}
              placeholder={t("reset_password.new_password_placeholder")}
              {...form.register("new_password")}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              tabIndex={-1}
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.new_password && (
            <p className="text-xs text-red-600">
              {errors.new_password.message}
            </p>
          )}

          {/* Confirm password */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {t("reset_password.confirm_password_label")} <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                placeholder={t("reset_password.confirm_password_placeholder")}
                {...form.register("confirm_password")}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                tabIndex={-1}
              >
                {showConfirm ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="text-xs text-red-600">
                {errors.confirm_password.message}
              </p>
            )}
          </div>

          {apiError && (
            <Alert variant="destructive">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("reset_password.updating")}
              </>
            ) : (
              t("reset_password.submit")
            )}
          </Button>
        </>
      )}
    </form>
  );
}
