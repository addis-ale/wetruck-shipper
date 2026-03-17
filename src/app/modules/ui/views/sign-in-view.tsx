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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import CaptchaComponent from "@/components/captcha/CaptchaComponent";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const formSchema = z.object({
  email: z.string().email("Please enter a valid business email"),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

export const SignInView = () => {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation(["auth", "common"]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaId, setCaptchaId] = useState<string>("");
  const [captchaSolution, setCaptchaSolution] = useState<string>("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
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
  }, []);

  const handleCaptchaError = useCallback((msg: string) => {
    // Make captcha errors more user-friendly
    const lowerMsg = msg.toLowerCase();
    if (lowerMsg.includes("captcha") || lowerMsg.includes("security code")) {
      setError(t("auth:errors.captcha_load_failed"));
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
        setError(t("auth:errors.captcha_incorrect"));
        // Refresh captcha on error
        setCaptchaSolution("");
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
        setError(t("auth:errors.network_error"));
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
        setError(t("auth:errors.invalid_credentials"));
      }
      // Account-related errors
      else if (
        lowerErrorMessage.includes("not found") ||
        lowerErrorMessage.includes("doesn't exist") ||
        lowerErrorMessage.includes("user not found")
      ) {
        setError(t("auth:errors.account_not_found"));
      } else if (
        lowerErrorMessage.includes("disabled") ||
        lowerErrorMessage.includes("suspended") ||
        lowerErrorMessage.includes("inactive")
      ) {
        setError(t("auth:errors.account_disabled"));
      }
      // Server errors
      else if (
        lowerErrorMessage.includes("500") ||
        lowerErrorMessage.includes("server error") ||
        lowerErrorMessage.includes("internal server")
      ) {
        setError(t("auth:errors.server_error"));
      }
      // Rate limiting
      else if (
        lowerErrorMessage.includes("too many") ||
        lowerErrorMessage.includes("rate limit") ||
        lowerErrorMessage.includes("429")
      ) {
        setError(t("auth:errors.too_many_attempts"));
      }
      // Generic fallback
      else {
        setError(t("auth:errors.login_failed"));
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
          <p className="text-sm text-muted-foreground">
            {t("auth:sign_in.loading")}
          </p>
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
            {t("auth:sign_in.redirecting")}
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
                      {t("auth:sign_in.title")}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                      {t("auth:sign_in.subtitle")}
                    </p>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel
                            className="text-xs font-semibold uppercase tracking-wider text-gray-500"
                            required
                          >
                            {t("auth:sign_in.email_label")}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                              <Input
                                placeholder={t(
                                  "auth:sign_in.email_placeholder",
                                )}
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
                            <FormLabel
                              className="text-xs font-semibold uppercase tracking-wider text-gray-500"
                              required
                            >
                              {t("auth:sign_in.password_label")}
                            </FormLabel>
                            <Link
                              href="/forgot-password"
                              className="text-xs text-primary hover:text-primary/80 hover:underline"
                            >
                              {t("auth:sign_in.forgot")}
                            </Link>
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

                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms-accept"
                      checked={termsAccepted}
                      onCheckedChange={(checked) =>
                        setTermsAccepted(checked === true)
                      }
                      className="mt-0.5"
                    />
                    <label
                      htmlFor="terms-accept"
                      className="text-xs text-gray-500 leading-snug cursor-pointer select-none"
                    >
                      {t("auth:sign_in.terms_prefix")}{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowTermsDialog(true);
                        }}
                        className="text-primary hover:text-primary/80 underline underline-offset-2 font-medium"
                      >
                        {t("auth:sign_in.terms_link")}
                      </button>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-white transition-all shadow-md active:scale-[0.98]"
                    disabled={
                      pending ||
                      !captchaId ||
                      captchaSolution.trim().length === 0 ||
                      !termsAccepted
                    }
                  >
                    {pending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("auth:sign_in.authenticating")}
                      </>
                    ) : (
                      t("auth:sign_in.submit")
                    )}
                  </Button>
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
                    {t("auth:brand.tagline_1")} <br />
                    <span>{t("auth:brand.tagline_2")}</span>
                  </h2>
                  <div className="h-1 w-20 bg-white mx-auto rounded-full" />
                </div>

                <p className="text-white/80 text-base max-w-[300px] leading-relaxed font-light italic">
                  {t("auth:brand.quote")}
                </p>
              </div>

              {/* Bottom Accent */}
              <div className="absolute bottom-8 left-8 right-8 z-10">
                <div className="flex justify-between items-center text-[10px] text-white/40 uppercase tracking-[0.2em]">
                  <span className="font-bold text-white/70">
                    {t("auth:brand.logistics")}
                  </span>
                  <span className="text-white">•</span>
                  <span className="font-bold text-white/70">
                    {t("auth:brand.efficiency")}
                  </span>
                  <span className="text-white">•</span>
                  <span className="font-bold text-white/70">
                    {t("auth:brand.control")}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="flex items-center justify-center gap-3">
          <p className="text-center text-xs text-gray-400">
            {t("auth:brand.copyright", { year: new Date().getFullYear() })}
          </p>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Terms & Conditions Dialog */}
      <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">
              {t("auth:terms_dialog.title")}
            </DialogTitle>
            <DialogDescription>
              {t("auth:terms_dialog.subtitle")}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 pr-2 space-y-5 text-sm text-gray-700 leading-relaxed">
            <section>
              <h3 className="font-semibold text-base text-gray-900 mb-2">
                {t("auth:terms_dialog.section_1_title")}
              </h3>
              <p>
                By clicking &ldquo;I Accept&rdquo;, you confirm that you have
                read, understood, and agree to be bound by the following
                responsibilities as a Transporter (Multimodal Transport
                Operator) or Freight Forwarder (acting as Shipper/Consignor) on
                the WeTruck Platform. These terms align with Ethiopian laws,
                including the Multimodal Transport Proclamation No. 548/2007,
                which governs international multimodal transport contracts,
                liabilities, and exemptions.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base text-gray-900 mb-2">
                {t("auth:terms_dialog.section_2_title")}
              </h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  All GPS devices installed on trucks and integrated with the
                  WeTruck Platform remain the exclusive property of the Company.
                  You must keep them active, functional, and completely
                  unaltered throughout every shipment (per Proclamation Art. 15
                  on period of responsibility).
                </li>
                <li>
                  If you, the truck owner, or your transport association ceases,
                  suspends, or terminates your relationship with the Company,
                  the Company has the full right to immediately remove,
                  retrieve, or deactivate the GPS device without any objection.
                </li>
                <li>
                  You bear full responsibility for the care, custody, and
                  control of the cargo from the moment of taking charge
                  (handover and acceptance) until delivery to the consignee or
                  authorized person at the agreed destination.
                </li>
                <li>
                  In case of theft, loss, damage, or delay to the cargo during
                  transit, you will be held liable according to this Agreement
                  and Ethiopian law, except when proven that: all reasonable
                  measures were taken to avoid the event, or the loss results
                  from force majeure (extraordinary, unforeseeable circumstances
                  beyond control, such as natural disasters, war, pandemics, or
                  government actions), inherent vice of the goods, or the
                  consignor&apos;s (shipper&apos;s) wrongful
                  act/neglect/instructions.
                </li>
                <li>
                  Liability is limited to 835 Special Drawing Rights (SDR) per
                  package or 2.5 SDR per kg of gross weight (whichever is
                  higher), unless otherwise agreed or the stage of loss is
                  identified under specific laws. For delay, liability is
                  limited to 2.5 times the freight, not exceeding total freight.
                </li>
                <li>
                  You must perform duties with due diligence and are liable for
                  acts/omissions of servants, agents, or others used in
                  performance (Proclamation Art. 16; Regulations No. 37/1998
                  Art. 12).
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base text-gray-900 mb-2">
                {t("auth:terms_dialog.section_3_title")}
              </h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  You must provide accurate, complete, and truthful information
                  about the cargo (general nature, marks, number of packages,
                  weight/quantity, dangerous character if applicable, container
                  details, destination) as required by the WeTruck Platform. You
                  guarantee the accuracy of these particulars and indemnify the
                  Company/Transporter for any losses from inaccuracies.
                </li>
                <li>
                  For dangerous goods, you must mark/label them and inform the
                  Transporter of their character and necessary precautions
                  (Proclamation Art. 29-31).
                </li>
                <li>
                  Upon arrival of the container at the destination, you must
                  complete offloading within the agreed free days specified in
                  the shipment terms.
                </li>
                <li>
                  If offloading exceeds the agreed free time, you will be liable
                  for detention charges calculated at the applicable rates.
                </li>
                <li>
                  You are liable for losses to the Transporter caused by your
                  fault/neglect or that of your servants/agents (Proclamation
                  Art. 28; Regulations No. 37/1998 Art. 12 on due diligence).
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base text-gray-900 mb-2">
                {t("auth:terms_dialog.section_4_title")}
              </h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  These terms form part of the full WeTruck User Agreement and
                  comply with Ethiopian laws.
                </li>
                <li>
                  Any stipulations derogating from the Multimodal Transport
                  Proclamation are null and void.
                </li>
                <li>
                  Continued use of the platform constitutes ongoing acceptance.
                </li>
                <li>Notices for loss/damage must be given in writing.</li>
                <li>
                  For apparent damage, the notice should be provided the next
                  working day; for non-apparent damage, within 7 days.
                </li>
                <li>
                  In no case when notice is delayed for more than 60 days shall
                  compensation be paid.
                </li>
                <li>
                  When court actions are instituted within 2 years, the right is
                  barred by the period of limitation.
                </li>
                <li>
                  Disputes shall be resolved by courts at the place of contract,
                  taking charge, or delivery which has jurisdiction to entertain
                  as per pertinent law.
                </li>
              </ul>
            </section>
          </div>

          <DialogFooter className="flex-row gap-2 pt-4 border-t">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">
                {t("auth:terms_dialog.close")}
              </Button>
            </DialogClose>
            <Button
              className="flex-1"
              onClick={() => {
                setTermsAccepted(true);
                setShowTermsDialog(false);
              }}
            >
              {t("auth:terms_dialog.accept")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
