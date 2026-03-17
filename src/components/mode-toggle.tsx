"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export function ModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t } = useTranslation("common");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 rounded-full"
      >
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">{t("theme.toggle")}</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-9 w-9 rounded-full"
      onClick={toggleTheme}
      aria-label={isDark ? t("theme.switch_to_light") : t("theme.switch_to_dark")}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">{t("theme.toggle")}</span>
    </Button>
  );
}
