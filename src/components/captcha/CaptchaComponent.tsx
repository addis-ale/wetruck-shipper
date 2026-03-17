"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useCaptcha } from "@/hooks/useCaptcha";
import { RefreshCw, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CaptchaComponentProps {
  onCaptchaVerified?: (captchaId: string, solution: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  showRefreshButton?: boolean;
  deferVerification?: boolean;
  onRefreshReady?: (refreshFn: () => void) => void;
}

const CaptchaComponent: React.FC<CaptchaComponentProps> = ({
  onCaptchaVerified,
  onError,
  disabled = false,
  showRefreshButton = true,
  deferVerification = false,
  onRefreshReady,
}) => {
  const [userInput, setUserInput] = useState<string>("");
  const { t } = useTranslation("auth");
  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const pathname = usePathname();

  const {
    captchaData,
    isLoading,
    error: hookError,
    isVerified,
    fetchCaptcha,
    verifyCaptcha,
    cleanup,
  } = useCaptcha();

  // Check if we're on the login page
  const isLoginPage = pathname === "/sign-in";

  // Store latest functions in refs to avoid stale closures
  const fetchCaptchaRef = useRef(fetchCaptcha);
  const cleanupRef = useRef(cleanup);
  const isVerifiedRef = useRef(isVerified);

  // Update refs when values change
  useEffect(() => {
    fetchCaptchaRef.current = fetchCaptcha;
    cleanupRef.current = cleanup;
    isVerifiedRef.current = isVerified;
  }, [fetchCaptcha, cleanup, isVerified]);

  // Initial fetch and auto-refresh - only on login page, or if manually triggered
  useEffect(() => {
    isMountedRef.current = true;

    // Always fetch on mount to show captcha
    fetchCaptchaRef.current();

    // If on login page, also set up auto-refresh
    if (isLoginPage) {
      // Auto-refresh every 55 seconds if not verified
      intervalRef.current = setInterval(() => {
        if (isMountedRef.current && !isVerifiedRef.current && isLoginPage) {
          fetchCaptchaRef.current();
        }
      }, 55000);
    }

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Call hook cleanup
      cleanupRef.current();
    };
  }, [isLoginPage, deferVerification]); // Re-run if login page status changes

  // Expose refresh function to parent
  useEffect(() => {
    if (onRefreshReady) {
      onRefreshReady(() => {
        if (isMountedRef.current) {
          fetchCaptcha();
          setUserInput("");
        }
      });
    }
  }, [fetchCaptcha, onRefreshReady]);

  // Handle errors
  useEffect(() => {
    if (hookError && onError) {
      onError(hookError);
    }
  }, [hookError, onError]);

  const hasInitiallyFocused = useRef(false);

  // Focus input only on first captcha load, not on auto-refresh
  useEffect(() => {
    if (
      captchaData?.imageUrl &&
      !isLoading &&
      !isVerified &&
      !hasInitiallyFocused.current
    ) {
      hasInitiallyFocused.current = true;
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [captchaData, isLoading, isVerified]);

  // Handle verification success
  useEffect(() => {
    if (isVerified && captchaData && onCaptchaVerified) {
      onCaptchaVerified(captchaData.captchaId, userInput);
    }
  }, [isVerified, captchaData, userInput, onCaptchaVerified]);

  // Call onCaptchaVerified when captcha loads and user has input (for deferVerification)
  useEffect(() => {
    if (
      deferVerification &&
      captchaData &&
      userInput.trim().length > 0 &&
      onCaptchaVerified
    ) {
      onCaptchaVerified(captchaData.captchaId, userInput);
    }
  }, [captchaData, userInput, deferVerification, onCaptchaVerified]);

  // Clear input when captcha refreshes
  useEffect(() => {
    if (captchaData) {
      setUserInput("");
    }
  }, [captchaData]);

  const handleVerify = async () => {
    if (!userInput.trim()) {
      return;
    }

    if (deferVerification && captchaData && onCaptchaVerified) {
      onCaptchaVerified(captchaData.captchaId, userInput);
      return;
    }

    await verifyCaptcha(userInput);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setUserInput(value);

    // If deferVerification is true, call onCaptchaVerified whenever user types
    if (
      deferVerification &&
      captchaData &&
      value.trim().length > 0 &&
      onCaptchaVerified
    ) {
      onCaptchaVerified(captchaData.captchaId, value);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !disabled && !isVerified) {
      handleVerify();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor="captcha-input"
          className="text-xs font-semibold uppercase tracking-wider text-gray-500"
        >
          {t("captcha.label")}
        </label>
        {showRefreshButton && (
          <button
            type="button"
            onClick={() => {
              if (isMountedRef.current) {
                fetchCaptchaRef.current();
                setUserInput("");
              }
            }}
            disabled={isLoading || disabled}
            className="p-1.5 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t("captcha.refresh")}
            title={t("captcha.refresh")}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 text-gray-600 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 text-gray-600" />
            )}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 relative border border-gray-200 rounded-md overflow-hidden bg-gray-50 flex items-center justify-center min-h-[60px]">
          {captchaData?.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={captchaData.imageUrl}
              alt="CAPTCHA"
              className="max-h-[60px] w-auto"
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-4">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              ) : (
                <span className="text-xs text-gray-400">{t("sign_in.loading")}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <input
          ref={inputRef}
          id="captcha-input"
          type="text"
          value={userInput}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={disabled || isVerified || isLoading}
          placeholder={t("captcha.placeholder")}
          className="w-full h-11 border border-gray-200 rounded-md px-3 focus-visible:ring-primary focus-visible:ring-offset-0 uppercase text-sm"
          aria-label="CAPTCHA text input"
          maxLength={6}
          autoComplete="off"
        />
      </div>

      {hookError && (
        <div className="text-xs text-red-600 mt-1" role="alert">
          {hookError}
        </div>
      )}
    </div>
  );
};

export default CaptchaComponent;
