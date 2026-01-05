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

type FormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const mutation = useRequestPasswordReset();
  const router = useRouter();

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
          OTP has been sent to your email. Redirecting…
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input
          placeholder="Enter your registered email"
          {...form.register("email")}
          className="pl-9"
        />
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
            Sending OTP...
          </>
        ) : (
          "Send OTP"
        )}
      </Button>
    </form>
  );
}
