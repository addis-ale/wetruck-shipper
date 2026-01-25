"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { OctagonAlert, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import CaptchaComponent from "@/components/captcha/CaptchaComponent";

const formSchema = z.object({
  email: z.string().email("Please enter a valid business email"),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

export const SignInView = () => {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaData, setCaptchaData] = useState<{
    id: string;
    solution: string;
  } | null>(null);
  const [captchaId, setCaptchaId] = useState<string>("");
  const [captchaSolution, setCaptchaSolution] = useState<string>("");
  const refreshCaptchaRef = useRef<(() => void) | null>(null);

  // Redirect to dashboard if already logged in (only on mount, not after login)
  useEffect(() => {
    if (!isLoading && isAuthenticated && !pending) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router, pending]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleCaptchaVerified = useCallback((id: string, solution: string) => {
    setCaptchaId(id);
    setCaptchaSolution(solution);
    setCaptchaData({ id, solution });
  }, []);

  const handleCaptchaError = useCallback((msg: string) => {
    // Make captcha errors more user-friendly
    const lowerMsg = msg.toLowerCase();
    if (lowerMsg.includes("captcha") || lowerMsg.includes("security code")) {
      setError(
        "Unable to load security code. Please refresh the page and try again."
      );
    } else {
      setError(msg);
    }
  }, []);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setPending(true);
      setError(null);

      await login(data.email, data.password, captchaId, captchaSolution);
      // Redirect immediately after successful login using replace to avoid history entry
      router.replace("/dashboard");
    } catch (err) {
      // Map backend errors to user-friendly messages
      const errorMessage = err instanceof Error ? err.message : "";
      const lowerErrorMessage = errorMessage.toLowerCase();

      // CAPTCHA errors - check first and refresh captcha
      if (
        lowerErrorMessage.includes("captcha") ||
        lowerErrorMessage.includes("security code") ||
        lowerErrorMessage.includes("incorrect captcha") ||
        lowerErrorMessage.includes("invalid captcha") ||
        lowerErrorMessage.includes("captcha expired") ||
        lowerErrorMessage.includes("captcha verification") ||
        (lowerErrorMessage.includes("400") &&
          (lowerErrorMessage.includes("captcha") ||
            lowerErrorMessage.includes("code")))
      ) {
        setError(
          "The security code you entered is incorrect. Please enter the code from the new image below."
        );
        // Refresh captcha on error
        setCaptchaSolution("");
        setCaptchaData(null);
        setCaptchaId("");
        // Trigger captcha refresh
        if (refreshCaptchaRef.current) {
          refreshCaptchaRef.current();
        }
        return;
      }

      // Network/Connection errors
      if (
        lowerErrorMessage.includes("failed to fetch") ||
        lowerErrorMessage.includes("network error") ||
        lowerErrorMessage.includes("cannot connect") ||
        lowerErrorMessage.includes("connection")
      ) {
        setError(
          "Unable to connect to the server. Please check your internet connection and try again."
        );
      }
      // Invalid credentials (but not captcha)
      else if (
        lowerErrorMessage.includes("invalid email") ||
        lowerErrorMessage.includes("invalid password") ||
        lowerErrorMessage.includes("incorrect password") ||
        lowerErrorMessage.includes("wrong password") ||
        lowerErrorMessage.includes("credentials") ||
        (lowerErrorMessage.includes("invalid") &&
          !lowerErrorMessage.includes("captcha")) ||
        (lowerErrorMessage.includes("incorrect") &&
          !lowerErrorMessage.includes("captcha")) ||
        lowerErrorMessage.includes("401")
      ) {
        setError(
          "The email or password you entered is incorrect. Please check your credentials and try again."
        );
      }
      // Account-related errors
      else if (
        lowerErrorMessage.includes("not found") ||
        lowerErrorMessage.includes("doesn't exist") ||
        lowerErrorMessage.includes("user not found")
      ) {
        setError(
          "No account found with this email address. Please check your email or contact support."
        );
      } else if (
        lowerErrorMessage.includes("disabled") ||
        lowerErrorMessage.includes("suspended") ||
        lowerErrorMessage.includes("inactive")
      ) {
        setError(
          "Your account has been disabled. Please contact support for assistance."
        );
      }
      // Server errors
      else if (
        lowerErrorMessage.includes("500") ||
        lowerErrorMessage.includes("server error") ||
        lowerErrorMessage.includes("internal server")
      ) {
        setError("A server error occurred. Please try again in a few moments.");
      }
      // Rate limiting
      else if (
        lowerErrorMessage.includes("too many") ||
        lowerErrorMessage.includes("rate limit") ||
        lowerErrorMessage.includes("429")
      ) {
        setError(
          "Too many login attempts. Please wait a few minutes before trying again."
        );
      }
      // Generic fallback
      else {
        setError(
          "Login failed. Please check your credentials and try again. If the problem persists, contact support."
        );
      }
    } finally {
      setPending(false);
    }
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if already authenticated (will redirect)
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-0 sm:p-4 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-6 w-full max-w-[450px] md:max-w-[900px] mx-auto">
        <Card className="overflow-hidden border-none shadow-none sm:shadow-sm bg-white p-0 gap-0">
          <CardContent className="grid p-0 md:grid-cols-2 min-h-[500px] md:min-h-[550px]">
            {/* Left Side: Form */}
            <div className="p-6 sm:p-8 md:p-12 flex flex-col justify-center">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5 sm:space-y-6"
                >
                  <div className="space-y-2 text-center md:text-left">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
                      Shipper Portal
                    </h1>
                    <p className="text-muted-foreground text-sm">
                      Enter your credentials to access your dashboard.
                    </p>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Email Address
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                              <Input
                                placeholder="name@company.com"
                                {...field}
                                className="pl-9 h-11 border border-gray-200 focus-visible:ring-primary focus-visible:ring-offset-0"
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Password
                            </FormLabel>
                            <a
                              href="#"
                              className="text-xs text-primary hover:text-primary/80 hover:underline"
                            >
                              Forgot?
                            </a>
                          </div>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                {...field}
                                className="pl-9 pr-10 h-11 border border-gray-200 focus-visible:ring-primary focus-visible:ring-offset-0 transition-all"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                                tabIndex={-1}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="pt-2">
                    <CaptchaComponent
                      onCaptchaVerified={handleCaptchaVerified}
                      onError={handleCaptchaError}
                      disabled={pending}
                      deferVerification={true}
                      onRefreshReady={(refreshFn) => {
                        refreshCaptchaRef.current = refreshFn;
                      }}
                    />
                  </div>

                  {error && (
                    <Alert
                      variant="destructive"
                      className="py-2 px-3 border-red-100 bg-red-50"
                    >
                      <OctagonAlert />
                      <AlertDescription className="text-xs font-medium">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-white transition-all shadow-md active:scale-[0.98]"
                    disabled={
                      pending ||
                      !captchaId ||
                      captchaSolution.trim().length === 0
                    }
                  >
                    {pending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>

                  <div className="text-center text-sm">
                    <span className="text-muted-foreground">
                      Don&apos;t have an account?{" "}
                    </span>
                    <a
                      href="#"
                      className="text-primary font-semibold hover:underline"
                    >
                      Sign Up
                    </a>
                  </div>
                </form>
              </Form>
            </div>

            {/* Right Side: Visual/Brand */}
            <div className="relative hidden md:flex flex-col items-center justify-center p-12 overflow-hidden bg-primary">
              {/* Background pattern */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />

              <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-8 w-full h-full">
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                    Move Forward, <br />
                    <span>Go Wide!</span>
                  </h2>
                  <div className="h-1 w-20 bg-white mx-auto rounded-full" />
                </div>

                <p className="text-white/80 text-base max-w-[300px] leading-relaxed font-light italic">
                  &quot;The most reliable freight partner for your business
                  growth.&quot;
                </p>
              </div>

              {/* Bottom Accent */}
              <div className="absolute bottom-8 left-8 right-8 z-10">
                <div className="flex justify-between items-center text-[10px] text-white/40 uppercase tracking-[0.2em]">
                  <span className="font-bold text-white/70">Logistics</span>
                  <span className="text-white">•</span>
                  <span className="font-bold text-white/70">Efficiency</span>
                  <span className="text-white">•</span>
                  <span className="font-bold text-white/70">Control</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <p className="text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()}{" "}
          <span className="text-primary font-medium">WeTruck</span> TechEnable
          Solutions PLC.
          <a
            href="#"
            className="ml-2 text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
          >
            Terms
          </a>
          <span className="mx-2 text-primary">•</span>
          <a
            href="#"
            className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
          >
            Privacy
          </a>
        </p>
      </div>
    </div>
  );
};
