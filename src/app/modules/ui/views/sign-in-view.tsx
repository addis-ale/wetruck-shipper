"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  OctagonAlert,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

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
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

const formSchema = z.object({
  email: z.string().email("Please enter a valid business email"),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

export const SignInView = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Debug state
  const [debugInfo, setDebugInfo] = useState<{
    request?: {
      endpoint: string;
      method: string;
      payload: Record<string, string>;
    };
    response?: {
      status: string;
      message: string;
    };
    error?: {
      message: string;
      type: string;
      fullError: string;
    };
    timestamp?: string;
  }>({});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setPending(true);
      setError(null);

      // Debug: Capture request
      const requestPayload = {
        email: data.email,
        password: "•••••••••", // Don't log actual password
        role: "shipper",
      };
      setDebugInfo({
        request: {
          endpoint: `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
          method: "POST",
          payload: requestPayload,
        },
        timestamp: new Date().toISOString(),
      });

      await login(data.email, data.password);

      // Debug: Success response
      setDebugInfo((prev) => ({
        ...prev,
        response: {
          status: "success",
          message: "Login successful, redirecting to dashboard...",
        },
      }));

      router.push("/dashboard");
    } catch (err) {
      // Debug: Capture error
      setDebugInfo((prev) => ({
        ...prev,
        error: {
          message: err instanceof Error ? err.message : "Unknown error",
          type: typeof err,
          fullError: JSON.stringify(err, Object.getOwnPropertyNames(err)),
        },
      }));

      // Map backend errors to user-friendly messages
      const errorMessage = err instanceof Error ? err.message : "";

      // Network/Connection errors
      if (
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("Network error") ||
        errorMessage.includes("Cannot connect")
      ) {
        setError(
          "Unable to connect to server. Please check your internet connection and try again."
        );
      }
      // Invalid credentials
      else if (
        errorMessage.includes("Invalid") ||
        errorMessage.includes("incorrect") ||
        errorMessage.includes("wrong")
      ) {
        setError(
          "Invalid email or password. Please check your credentials and try again."
        );
      }
      // Account-related errors
      else if (
        errorMessage.includes("not found") ||
        errorMessage.includes("doesn't exist")
      ) {
        setError(
          "No account found with this email. Please check your email or contact support."
        );
      } else if (
        errorMessage.includes("disabled") ||
        errorMessage.includes("suspended")
      ) {
        setError(
          "Your account has been disabled. Please contact support for assistance."
        );
      }
      // Server errors
      else if (
        errorMessage.includes("500") ||
        errorMessage.includes("server error")
      ) {
        setError("Server error occurred. Please try again in a few moments.");
      }
      // Rate limiting
      else if (
        errorMessage.includes("too many") ||
        errorMessage.includes("rate limit")
      ) {
        setError(
          "Too many login attempts. Please wait a few minutes and try again."
        );
      }
      // Generic fallback
      else {
        setError(
          errorMessage ||
            "Authentication failed. Please try again or contact support if the problem persists."
        );
      }
    } finally {
      setPending(false);
    }
  };

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
                      Shipper <span className="text-amber-600">Portal</span>
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
                              className="text-xs text-amber-600 hover:text-amber-700 hover:underline"
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
                    disabled={pending}
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
                      className="text-amber-600 font-semibold hover:underline"
                    >
                      Sign Up
                    </a>
                  </div>

                  {/* Mock Credentials Hint */}
                  <div className="rounded-lg border border-dashed border-amber-600/50 bg-amber-600/5 p-3 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <ShieldCheck className="h-3 w-3 text-primary" />
                      <p className="text-[10px] uppercase tracking-widest font-bold text-primary/60">
                        Dev Access
                      </p>
                    </div>
                    <p className="text-xs text-primary/80">
                      <span className="font-semibold">Email:</span>{" "}
                      shipper@example.com
                      <br />
                      <span className="font-semibold">Password:</span>{" "}
                      shipper123
                    </p>
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
                    <span className="text-amber-500">Go Wide!</span>
                  </h2>
                  <div className="h-1 w-20 bg-amber-500 mx-auto rounded-full" />
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

        {/* Debug Panel - Only in Development */}
        {process.env.NODE_ENV === "development" && (
          <Card className="border-2 border-amber-500/30 bg-slate-900 text-white shadow-xl">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
                <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  🐛 Debug Panel
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded uppercase">
                    Dev Only
                  </span>
                </h3>
                <button
                  onClick={() => setDebugInfo({})}
                  className="text-[10px] text-gray-400 hover:text-white transition-colors"
                >
                  Clear
                </button>
              </div>

              {Object.keys(debugInfo).length === 0 ? (
                <p className="text-xs text-gray-400 italic">
                  No API activity yet. Try logging in to see request/response
                  data.
                </p>
              ) : (
                <div className="space-y-2 text-xs font-mono">
                  {debugInfo.timestamp && (
                    <div className="text-gray-400">
                      <span className="text-cyan-400 font-semibold">
                        Timestamp:
                      </span>{" "}
                      {new Date(debugInfo.timestamp).toLocaleTimeString()}
                    </div>
                  )}

                  {debugInfo.request && (
                    <div className="space-y-1">
                      <div className="text-blue-400 font-semibold">
                        📤 Request Payload:
                      </div>
                      <pre className="bg-slate-800 p-2 rounded text-[10px] overflow-x-auto text-green-300">
                        {JSON.stringify(debugInfo.request, null, 2)}
                      </pre>
                    </div>
                  )}

                  {debugInfo.response && (
                    <div className="space-y-1">
                      <div className="text-green-400 font-semibold">
                        ✅ Response:
                      </div>
                      <pre className="bg-slate-800 p-2 rounded text-[10px] overflow-x-auto text-green-300">
                        {JSON.stringify(debugInfo.response, null, 2)}
                      </pre>
                    </div>
                  )}

                  {debugInfo.error && (
                    <div className="space-y-1">
                      <div className="text-red-400 font-semibold">
                        ❌ Error:
                      </div>
                      <pre className="bg-slate-800 p-2 rounded text-[10px] overflow-x-auto text-red-300">
                        {JSON.stringify(debugInfo.error, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="pt-2 border-t border-amber-500/20">
                    <p className="text-[9px] text-gray-500">
                      💡 Tip: Check browser DevTools &gt; Network tab for full
                      request details
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer Links */}
        <p className="text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()}{" "}
          <span className="text-amber-600 font-medium">WeTruck</span> TechEnable
          Solutions PLC.
          <a
            href="#"
            className="ml-2 text-amber-600 hover:text-amber-700 underline underline-offset-4 transition-colors"
          >
            Terms
          </a>
          <span className="mx-2 text-amber-600">•</span>
          <a
            href="#"
            className="text-amber-600 hover:text-amber-700 underline underline-offset-4 transition-colors"
          >
            Privacy
          </a>
        </p>
      </div>
    </div>
  );
};
