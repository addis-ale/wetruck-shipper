export const DEFAULT_LANGUAGE = "en";
export const FALLBACK_LANGUAGE = "en";

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", dir: "ltr" },
  { code: "am", name: "Amharic", nativeName: "አማርኛ", dir: "ltr" },
  { code: "so", name: "Somali", nativeName: "Soomaali", dir: "ltr" },
  { code: "ti", name: "Tigrinya", nativeName: "ትግርኛ", dir: "ltr" },
  { code: "om", name: "Afan Oromo", nativeName: "Afaan Oromoo", dir: "ltr" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export const LANGUAGE_STORAGE_KEY = "wetruck-language";

export const DEFAULT_NAMESPACES = ["common"] as const;

export const ALL_NAMESPACES = [
  "common",
  "auth",
  "shipment",
  "container",
  "organization",
  "dashboard",
  "validation",
] as const;

export type Namespace = (typeof ALL_NAMESPACES)[number];
