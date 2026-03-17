import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { resources } from "./locales";
import {
  FALLBACK_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  DEFAULT_NAMESPACES,
} from "./constants";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: FALLBACK_LANGUAGE,
    defaultNS: DEFAULT_NAMESPACES[0],
    ns: [...DEFAULT_NAMESPACES],

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"],
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
