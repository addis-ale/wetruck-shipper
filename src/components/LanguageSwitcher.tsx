"use client";

import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@/i18n/constants";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const currentLanguage = SUPPORTED_LANGUAGES.find(
    (lang) => lang.code === i18n.language,
  );

  function handleLanguageChange(code: LanguageCode) {
    i18n.changeLanguage(code);
    document.documentElement.lang = code;
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
    if (lang) {
      document.documentElement.dir = lang.dir;
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full"
        >
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">
            {currentLanguage?.nativeName ?? "Language"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="space-y-1 p-1">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`rounded-md cursor-pointer transition-colors hover:!bg-primary hover:!text-white ${
              i18n.language === lang.code
                ? "bg-primary text-white font-semibold"
                : ""
            }`}
          >
            {lang.nativeName}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
