"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { resetPasswordSchema } from "@/lib/zod/auth.schema";
import { z } from "zod";
import { Loader2, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useConfirmPasswordReset } from "../../server/hooks/use-confirm-password-reset";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

type FormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const mutation = useConfirmPasswordReset();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      code: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    await mutation.mutateAsync({
      code: data.code,
      new_password: data.new_password,
    });
  };

  // ✅ Auto redirect after success
  useEffect(() => {
    if (mutation.isSuccess) {
      const timer = setTimeout(() => {
        router.push("/sign-in");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [mutation.isSuccess, router]);

  if (mutation.isSuccess) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-sm text-green-700">
          Password updated successfully. Redirecting to sign in…
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Input placeholder="Enter OTP" {...form.register("code")} />

      <Input
        type="password"
        placeholder="New password"
        {...form.register("new_password")}
      />

      <Input
        type="password"
        placeholder="Confirm password"
        {...form.register("confirm_password")}
      />

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
            Updating...
          </>
        ) : (
          "Reset Password"
        )}
      </Button>
    </form>
  );
}
