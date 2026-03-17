# WeTruck Multilingual (i18n) Implementation Guide

## 1. Technology Choice

### Selected: `i18next` + `react-i18next`

| Criteria                      | i18next + react-i18next | next-intl              | react-intl   |
| ----------------------------- | ----------------------- | ---------------------- | ------------ |
| Works with `output: "export"` | ✅ Yes                  | ❌ Requires middleware | ✅ Yes       |
| Works with Capacitor          | ✅ Yes                  | ⚠️ Limited             | ✅ Yes       |
| Framework-agnostic            | ✅ Yes                  | ❌ Next.js only        | ✅ Yes       |
| Ecosystem & plugins           | ✅ Largest              | ⚠️ Small               | ⚠️ Medium    |
| Namespace support             | ✅ Built-in             | ⚠️ Manual              | ❌ No        |
| Lazy loading                  | ✅ Built-in             | ⚠️ Manual              | ❌ No        |
| TypeScript support            | ✅ Excellent            | ✅ Excellent           | ⚠️ Moderate  |
| Community & docs              | ✅ Largest              | ⚠️ Growing             | ⚠️ Declining |

### Packages

```
i18next                    — Core i18n framework
react-i18next              — React bindings (hooks, components, HOC)
i18next-browser-languagedetector — Auto-detect browser/device language
i18next-http-backend       — (Optional) Load translations from server/CDN
```

---

## 2. Folder Structure & File Organization

```
src/
├── i18n/
│   ├── index.ts                    # i18n initialization & configuration
│   ├── types.ts                    # TypeScript declarations for type-safe keys
│   ├── locales/
│   │   ├── en/                     # English translations
│   │   │   ├── common.json         # Shared strings (buttons, labels, errors)
│   │   │   ├── auth.json           # Auth module strings
│   │   │   ├── shipment.json       # Shipment module strings
│   │   │   ├── container.json      # Container module strings
│   │   │   ├── organization.json   # Organization module strings
│   │   │   ├── dashboard.json      # Dashboard strings
│   │   │   └── validation.json     # Validation error messages
│   │   ├── am/                     # Amharic translations (same file names)
│   │   │   ├── common.json
│   │   │   ├── auth.json
│   │   │   ├── shipment.json
│   │   │   ├── container.json
│   │   │   ├── organization.json
│   │   │   ├── dashboard.json
│   │   │   └── validation.json
│   │   └── index.ts                # Barrel export for all locales
│   └── constants.ts                # Supported languages, default language
├── components/
│   └── providers/
│       └── I18nProvider.tsx         # i18n React provider
```

### Namespace Strategy

Each **feature module** gets its own namespace (JSON file). This enables:

- **Lazy loading** — Only load the translations needed for the current page.
- **Team ownership** — Each team owns their module's translations.
- **Reduced merge conflicts** — Separate files per module.

| Namespace      | Contents                                               |
| -------------- | ------------------------------------------------------ |
| `common`       | Buttons, labels, navigation, generic errors, shared UI |
| `auth`         | Sign in, sign up, forgot/reset password                |
| `shipment`     | Shipment listing, details, tracking, pricing           |
| `container`    | Container listing, details                             |
| `organization` | Organization settings, documents                       |
| `dashboard`    | Dashboard-specific strings                             |
| `validation`   | Form validation error messages                         |

---

## 4. Installation & Setup

### Step 1: Install Dependencies

```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

### Step 2: Create Constants

**`src/i18n/constants.ts`**

```typescript
export const DEFAULT_LANGUAGE = "en";
export const FALLBACK_LANGUAGE = "en";

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", dir: "ltr" },
  { code: "am", name: "Amharic", nativeName: "አማርኛ", dir: "ltr" },
  // Add more languages as needed:
  // { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl" },
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
```

---

## 5. Configuration

### Step 3: Create Translation Files

**`src/i18n/locales/en/common.json`**

```json
{
  "app_name": "WeTruck",
  "buttons": {
    "submit": "Submit",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "back": "Back",
    "next": "Next",
    "confirm": "Confirm",
    "close": "Close",
    "retry": "Retry",
    "loading": "Loading...",
    "search": "Search",
    "filter": "Filter",
    "clear": "Clear",
    "apply": "Apply",
    "view_all": "View All",
    "show_more": "Show More",
    "show_less": "Show Less"
  },
  "labels": {
    "email": "Email",
    "password": "Password",
    "phone": "Phone Number",
    "name": "Name",
    "status": "Status",
    "date": "Date",
    "actions": "Actions",
    "description": "Description",
    "no_data": "No data available",
    "language": "Language"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "shipments": "Shipments",
    "containers": "Containers",
    "organization": "Organization",
    "documents": "Documents",
    "settings": "Settings",
    "profile": "Profile",
    "logout": "Logout"
  },
  "errors": {
    "generic": "Something went wrong. Please try again.",
    "network": "Network error. Please check your connection.",
    "not_found": "The requested resource was not found.",
    "unauthorized": "You are not authorized to perform this action.",
    "session_expired": "Your session has expired. Please sign in again."
  },
  "status": {
    "active": "Active",
    "inactive": "Inactive",
    "pending": "Pending",
    "completed": "Completed",
    "cancelled": "Cancelled"
  },
  "confirmation": {
    "delete_title": "Are you sure?",
    "delete_message": "This action cannot be undone."
  }
}
```

**`src/i18n/locales/en/auth.json`**

```json
{
  "sign_in": {
    "title": "Sign In",
    "subtitle": "Enter your credentials to access your account",
    "email_placeholder": "Enter your email",
    "password_placeholder": "Enter your password",
    "remember_me": "Remember me",
    "forgot_password": "Forgot password?",
    "submit": "Sign In",
    "no_account": "Don't have an account?",
    "sign_up_link": "Sign Up"
  },
  "forgot_password": {
    "title": "Forgot Password",
    "subtitle": "Enter your email and we'll send you a reset link",
    "email_placeholder": "Enter your email",
    "submit": "Send Reset Link",
    "back_to_login": "Back to Sign In",
    "success": "Password reset link sent to your email."
  },
  "reset_password": {
    "title": "Reset Password",
    "subtitle": "Enter your new password",
    "new_password": "New Password",
    "confirm_password": "Confirm Password",
    "submit": "Reset Password",
    "success": "Password reset successfully. You can now sign in."
  },
  "errors": {
    "invalid_credentials": "Invalid email or password.",
    "account_locked": "Your account has been locked. Please contact support.",
    "email_required": "Email is required.",
    "password_required": "Password is required."
  }
}
```

**`src/i18n/locales/am/common.json`** (Amharic example)

```json
{
  "app_name": "WeTruck",
  "buttons": {
    "submit": "አስገባ",
    "cancel": "ሰርዝ",
    "save": "አስቀምጥ",
    "delete": "ሰርዝ",
    "edit": "አርትዕ",
    "back": "ተመለስ",
    "next": "ቀጣይ",
    "confirm": "አረጋግጥ",
    "close": "ዝጋ",
    "retry": "እንደገና ሞክር",
    "loading": "በመጫን ላይ...",
    "search": "ፈልግ",
    "filter": "አጣራ",
    "clear": "አጽዳ",
    "apply": "ተግብር",
    "view_all": "ሁሉንም ይመልከቱ",
    "show_more": "ተጨማሪ አሳይ",
    "show_less": "ያነሰ አሳይ"
  },
  "labels": {
    "email": "ኢሜይል",
    "password": "የይለፍ ቃል",
    "phone": "ስልክ ቁጥር",
    "name": "ስም",
    "status": "ሁኔታ",
    "date": "ቀን",
    "actions": "ድርጊቶች",
    "description": "መግለጫ",
    "no_data": "ምንም ውሂብ የለም",
    "language": "ቋንቋ"
  },
  "navigation": {
    "dashboard": "ዳሽቦርድ",
    "shipments": "ጭነቶች",
    "containers": "ኮንቴይነሮች",
    "organization": "ድርጅት",
    "documents": "ሰነዶች",
    "settings": "ቅንብሮች",
    "profile": "መገለጫ",
    "logout": "ውጣ"
  },
  "errors": {
    "generic": "የሆነ ችግር ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።",
    "network": "የአውታረ መረብ ስህተት። እባክዎ ግንኙነትዎን ያረጋግጡ።",
    "not_found": "የተጠየቀው ሀብት አልተገኘም።",
    "unauthorized": "ይህን ድርጊት ለማከናወን ፍቃድ የለዎትም።",
    "session_expired": "ክፍለ ጊዜዎ አልቋል። እባክዎ እንደገና ይግቡ።"
  },
  "status": {
    "active": "ንቁ",
    "inactive": "ንቁ ያልሆነ",
    "pending": "በመጠባበቅ ላይ",
    "completed": "የተጠናቀቀ",
    "cancelled": "የተሰረዘ"
  },
  "confirmation": {
    "delete_title": "እርግጠኛ ነዎት?",
    "delete_message": "ይህ ድርጊት ሊቀለበስ አይችልም።"
  }
}
```

### Step 4: Create the Locale Barrel Export

**`src/i18n/locales/index.ts`**

```typescript
import enCommon from "./en/common.json";
import enAuth from "./en/auth.json";
import enShipment from "./en/shipment.json";
import enContainer from "./en/container.json";
import enOrganization from "./en/organization.json";
import enDashboard from "./en/dashboard.json";
import enValidation from "./en/validation.json";

import amCommon from "./am/common.json";
import amAuth from "./am/auth.json";
import amShipment from "./am/shipment.json";
import amContainer from "./am/container.json";
import amOrganization from "./am/organization.json";
import amDashboard from "./am/dashboard.json";
import amValidation from "./am/validation.json";

export const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    shipment: enShipment,
    container: enContainer,
    organization: enOrganization,
    dashboard: enDashboard,
    validation: enValidation,
  },
  am: {
    common: amCommon,
    auth: amAuth,
    shipment: amShipment,
    container: amContainer,
    organization: amOrganization,
    dashboard: amDashboard,
    validation: amValidation,
  },
} as const;
```

### Step 5: Initialize i18next

**`src/i18n/index.ts`**

```typescript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { resources } from "./locales";
import {
  DEFAULT_LANGUAGE,
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
    ns: DEFAULT_NAMESPACES,

    interpolation: {
      escapeValue: false, // React already escapes
    },

    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"],
    },

    react: {
      useSuspense: false, // Required for static export / Capacitor
    },
  });

export default i18n;
```

### Step 6: Create the Provider

**`src/components/providers/I18nProvider.tsx`**

```tsx
"use client";

import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
```

### Step 7: Add to Root Layout

In your root `layout.tsx`, wrap the app with the `I18nProvider`:

```tsx
import { I18nProvider } from "@/components/providers/I18nProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <I18nProvider>
          <ThemeProvider>
            <QueryProvider>
              <AuthProvider>{children}</AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
```

---

## 6. Translation File Format & Conventions

### JSON Structure Rules

1. **Flat nesting** — Maximum 2 levels deep. Never go deeper.
2. **Group by feature/section** — Not by component.
3. **Use snake_case** for keys.
4. **English values are the source of truth.**

```json
// ✅ GOOD — Grouped by section, max 2 levels
{
  "sign_in": {
    "title": "Sign In",
    "subtitle": "Enter your credentials"
  }
}

// ❌ BAD — Too deeply nested
{
  "pages": {
    "auth": {
      "sign_in": {
        "form": {
          "title": "Sign In"
        }
      }
    }
  }
}

// ❌ BAD — Using camelCase
{
  "signIn": {
    "formTitle": "Sign In"
  }
}
```

### File Rules

| Rule          | Details                                                                       |
| ------------- | ----------------------------------------------------------------------------- |
| Encoding      | UTF-8 (required for Amharic, Arabic, etc.)                                    |
| Format        | Standard JSON (no comments, no trailing commas)                               |
| Sorting       | Keys sorted alphabetically within each group                                  |
| Empty values  | Never commit empty string values `""` — use the English string as placeholder |
| Max file size | If a namespace file exceeds ~200 keys, split it                               |

---

## 7. Using Translations in Components

### The `useTranslation` Hook (Primary Method)

```tsx
"use client";

import { useTranslation } from "react-i18next";

export function SignInForm() {
  const { t } = useTranslation("auth"); // Load "auth" namespace

  return (
    <div>
      <h1>{t("sign_in.title")}</h1>
      <p>{t("sign_in.subtitle")}</p>
      <button>{t("sign_in.submit")}</button>
      <a href="/forgot-password">{t("sign_in.forgot_password")}</a>
    </div>
  );
}
```

### Using Multiple Namespaces

```tsx
import { useTranslation } from "react-i18next";

export function ShipmentCard() {
  const { t } = useTranslation(["shipment", "common"]);

  return (
    <div>
      <h2>{t("shipment:detail.title")}</h2>
      <span>{t("common:status.pending")}</span>
      <button>{t("common:buttons.edit")}</button>
    </div>
  );
}
```

### The `Trans` Component (For Rich Text / JSX)

Use `Trans` when translations contain HTML or React components:

```tsx
import { Trans, useTranslation } from "react-i18next";

export function WelcomeMessage() {
  const { t } = useTranslation("dashboard");

  // Translation: "welcome_message": "Welcome back, <bold>{{name}}</bold>! You have <link>{{count}} shipments</link>."
  return (
    <Trans
      i18nKey="dashboard:welcome_message"
      values={{ name: "John", count: 5 }}
      components={{
        bold: <strong />,
        link: <a href="/dashboard/shipments" />,
      }}
    />
  );
}
```

### Non-Component Usage (API Calls, Utilities)

For translation outside React components:

```typescript
import i18n from "@/i18n";

export function getErrorMessage(code: string): string {
  return i18n.t(`errors.${code}`, { ns: "common" });
}
```

---

## 8. Date, Number & Currency Formatting

### Create a Formatting Utility

**`src/lib/format.ts`**

```typescript
import i18n from "@/i18n";

/**
 * Format a date according to the current locale.
 */
export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const locale = i18n.language;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  };

  return d.toLocaleDateString(locale, defaultOptions);
}

/**
 * Format a date with time according to the current locale.
 */
export function formatDateTime(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const locale = i18n.language;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  };

  return d.toLocaleString(locale, defaultOptions);
}

/**
 * Format a number according to the current locale.
 */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  const locale = i18n.language;
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format currency according to the current locale.
 */
export function formatCurrency(
  value: number,
  currency = "ETB",
  options?: Intl.NumberFormatOptions,
): string {
  const locale = i18n.language;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    ...options,
  }).format(value);
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days").
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const locale = i18n.language;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (Math.abs(diffDay) >= 1) return rtf.format(diffDay, "day");
  if (Math.abs(diffHour) >= 1) return rtf.format(diffHour, "hour");
  if (Math.abs(diffMin) >= 1) return rtf.format(diffMin, "minute");
  return rtf.format(diffSec, "second");
}
```

### Usage in Components

```tsx
// ❌ BEFORE (hardcoded locale)
<span>{new Date(shipment.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
<span>{price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>

// ✅ AFTER (locale-aware)
import { formatDate, formatCurrency } from "@/lib/format";

<span>{formatDate(shipment.date)}</span>
<span>{formatCurrency(price, "ETB")}</span>
```

---

## 9. Zod Validation Messages

### Approach: Translate at Render Time, Not Schema Definition Time

Since Zod schemas are defined once (at module scope), we pass translation keys and resolve them when displaying errors.

**`src/i18n/locales/en/validation.json`**

```json
{
  "required": "This field is required",
  "email_invalid": "Please enter a valid email address",
  "password_min": "Password must be at least {{min}} characters",
  "password_match": "Passwords do not match",
  "phone_invalid": "Please enter a valid phone number",
  "number_positive": "Value must be a positive number",
  "max_length": "Must be {{max}} characters or less",
  "min_length": "Must be at least {{min}} characters"
}
```

**Option A: Custom Error Map (Recommended)**

**`src/lib/zod-i18n.ts`**

```typescript
import { z } from "zod";
import i18n from "@/i18n";

export function setupZodI18n() {
  z.setErrorMap((issue, ctx) => {
    const t = i18n.t.bind(i18n);

    switch (issue.code) {
      case z.ZodIssueCode.too_small:
        if (issue.type === "string") {
          if (issue.minimum === 1) {
            return { message: t("validation:required") };
          }
          return {
            message: t("validation:min_length", { min: issue.minimum }),
          };
        }
        break;
      case z.ZodIssueCode.too_big:
        if (issue.type === "string") {
          return {
            message: t("validation:max_length", { max: issue.maximum }),
          };
        }
        break;
      case z.ZodIssueCode.invalid_string:
        if (issue.validation === "email") {
          return { message: t("validation:email_invalid") };
        }
        break;
    }

    return { message: ctx.defaultError };
  });
}
```

Call `setupZodI18n()` in your i18n init file after `i18n.init()`.

**Option B: Inline Translation Keys**

```typescript
import { z } from "zod";

export const signInSchema = z.object({
  email: z
    .string()
    .min(1, "validation:required")
    .email("validation:email_invalid"),
  password: z.string().min(1, "validation:required"),
});
```

Then resolve in your form error display:

```tsx
import { useTranslation } from "react-i18next";

function FormError({ message }: { message: string }) {
  const { t } = useTranslation();
  const isKey = message.includes(":");
  return <p className="text-red-500 text-sm">{isKey ? t(message) : message}</p>;
}
```

---

## 10. Language Switcher Component

**`src/components/LanguageSwitcher.tsx`**

```tsx
"use client";

import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@/i18n/constants";

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
    <Select value={i18n.language} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue>{currentLanguage?.nativeName ?? "Language"}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.nativeName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### Where to Place the Switcher

- **In the sidebar/header** of the dashboard layout
- **On the sign-in page** (accessible before authentication)
- **In settings/profile page** for explicit preference

---

## 11. RTL (Right-to-Left) Support

If supporting Arabic or other RTL languages:

### Tailwind CSS RTL Setup

In `globals.css`:

```css
/* RTL-aware utilities */
[dir="rtl"] .rtl\:space-x-reverse > :not(:first-child) {
  margin-right: var(--tw-space-x-reverse);
  margin-left: 0;
}
```

### In Components

Use Tailwind's logical properties:

```tsx
// ❌ BAD — Directional (breaks in RTL)
<div className="ml-4 pl-2 text-left">

// ✅ GOOD — Logical (works in both LTR and RTL)
<div className="ms-4 ps-2 text-start">
```

| Physical Property | Logical Property       |
| ----------------- | ---------------------- |
| `ml-*`            | `ms-*` (margin-start)  |
| `mr-*`            | `me-*` (margin-end)    |
| `pl-*`            | `ps-*` (padding-start) |
| `pr-*`            | `pe-*` (padding-end)   |
| `text-left`       | `text-start`           |
| `text-right`      | `text-end`             |
| `left-*`          | `start-*`              |
| `right-*`         | `end-*`                |

---

## 12. Pluralization & Interpolation

### Interpolation (Variables)

```json
{
  "welcome": "Welcome, {{name}}!",
  "items_count": "You have {{count}} items"
}
```

```tsx
t("welcome", { name: "John" }); // "Welcome, John!"
t("items_count", { count: 5 }); // "You have 5 items"
```

### Pluralization

i18next uses suffixed keys for plurals:

```json
{
  "shipment_count_one": "{{count}} shipment",
  "shipment_count_other": "{{count}} shipments"
}
```

```tsx
t("shipment_count", { count: 1 }); // "1 shipment"
t("shipment_count", { count: 5 }); // "5 shipments"
```

For languages with complex plural rules (like Arabic with zero/one/two/few/many/other), i18next handles this automatically based on the CLDR plural rules:

```json
{
  "shipment_count_zero": "لا شحنات",
  "shipment_count_one": "شحنة واحدة",
  "shipment_count_two": "شحنتان",
  "shipment_count_few": "{{count}} شحنات",
  "shipment_count_many": "{{count}} شحنة",
  "shipment_count_other": "{{count}} شحنة"
}
```

### Context

```json
{
  "greeting_male": "Welcome back, Mr. {{name}}",
  "greeting_female": "Welcome back, Ms. {{name}}"
}
```

```tsx
t("greeting", { name: "Smith", context: "male" }); // "Welcome back, Mr. Smith"
t("greeting", { name: "Smith", context: "female" }); // "Welcome back, Ms. Smith"
```

---

## 13. Naming Conventions & Translation Keys

### Key Naming Rules

| Rule                 | Example                 | Explanation                      |
| -------------------- | ----------------------- | -------------------------------- |
| Use `snake_case`     | `sign_in_title`         | Consistent with JSON conventions |
| Be descriptive       | `shipment_detail_title` | Not `title` or `t1`              |
| Group by feature     | `sign_in.title`         | Not `titles.sign_in`             |
| Use noun for labels  | `email`                 | Not `enter_email`                |
| Use verb for actions | `submit`, `save`        | Not `submission`                 |
| Suffix with context  | `delete_confirm_title`  | Clarifies usage                  |

### Namespace Prefixing in Code

Always specify the namespace explicitly:

```tsx
// ✅ GOOD — Explicit namespace
t("auth:sign_in.title");
t("common:buttons.submit");

// ❌ BAD — Relies on default namespace
t("sign_in.title"); // Which namespace? Ambiguous.
```

Exception: When using `useTranslation("auth")`, you can omit the prefix within that namespace:

```tsx
const { t } = useTranslation("auth");
t("sign_in.title"); // ✅ Fine, namespace is clear from hook
```

---

## 14. Workflow for Adding New Strings

### For Developers

1. **Never hardcode user-facing strings.** Every visible string must use `t()`.

2. **Add the English translation first** in the appropriate namespace file.

3. **Use the key immediately** in the component.

4. **Add a placeholder in other language files** (copy the English value). Mark with `[TODO]` prefix if needed:

   ```json
   { "new_feature_title": "[TODO] New Feature Title" }
   ```

5. **Create a translation PR** or ticket for the translation team.

### PR Checklist

- [ ] All new user-facing strings use `t()` with explicit namespace
- [ ] English translation file updated with new keys
- [ ] Other language files updated with placeholder values
- [ ] No hardcoded strings in JSX/TSX (check with linter rule)
- [ ] Date/number formatting uses `formatDate()`/`formatNumber()` utilities
- [ ] Translation keys follow naming conventions

### Git Commit Convention

```
feat(i18n): add translations for shipment tracking feature
fix(i18n): correct Amharic translation for sign-in page
chore(i18n): add missing translation keys for container module
```

---

## 15. Shared Translations Across Repos

### Strategy: Shared NPM Package

For strings shared across all repos (e.g., common UI, error messages):

```
packages/
  wetruck-i18n-common/        # Shared package
    src/
      locales/
        en/common.json
        am/common.json
      index.ts
    package.json
```

Each repo installs:

```bash
npm install @wetruck/i18n-common
```

And merges shared resources:

```typescript
import { sharedResources } from "@wetruck/i18n-common";
import { resources as localResources } from "./locales";

const resources = {
  en: { ...sharedResources.en, ...localResources.en },
  am: { ...sharedResources.am, ...localResources.am },
};
```

### Alternative: Git Submodule

If NPM package management is too heavy:

```bash
git submodule add <shared-i18n-repo-url> src/i18n/shared
```

---

## 16. Testing

### Unit Testing Translations

**`src/i18n/__tests__/translations.test.ts`**

```typescript
import { resources } from "../locales";
import { SUPPORTED_LANGUAGES, ALL_NAMESPACES } from "../constants";

describe("Translation completeness", () => {
  const baseLanguage = "en";

  function getAllKeys(obj: Record<string, unknown>, prefix = ""): string[] {
    return Object.entries(obj).flatMap(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === "object" && value !== null) {
        return getAllKeys(value as Record<string, unknown>, fullKey);
      }
      return [fullKey];
    });
  }

  SUPPORTED_LANGUAGES.forEach(({ code }) => {
    if (code === baseLanguage) return;

    ALL_NAMESPACES.forEach((ns) => {
      it(`${code}/${ns} has all keys from ${baseLanguage}/${ns}`, () => {
        const baseKeys = getAllKeys(
          (resources as Record<string, Record<string, unknown>>)[
            baseLanguage
          ]?.[ns] ?? {},
        );
        const targetKeys = getAllKeys(
          (resources as Record<string, Record<string, unknown>>)[code]?.[ns] ??
            {},
        );

        const missing = baseKeys.filter((key) => !targetKeys.includes(key));

        expect(missing).toEqual([]);
      });
    });
  });
});
```

### ESLint Rule (Optional but Recommended)

Install `eslint-plugin-i18next` to catch hardcoded strings:

```bash
npm install -D eslint-plugin-i18next
```

```javascript
// eslint.config.mjs
import i18next from "eslint-plugin-i18next";

export default [
  // ... other configs
  {
    plugins: { i18next },
    rules: {
      "i18next/no-literal-string": [
        "warn",
        {
          markupOnly: true,
          ignoreAttribute: [
            "data-testid",
            "className",
            "href",
            "type",
            "name",
            "id",
          ],
        },
      ],
    },
  },
];
```

---

## 17. Migration Strategy (Existing Repos)

### Phase 1: Setup (1-2 days)

1. Install packages
2. Create `src/i18n/` folder structure
3. Set up `i18n/index.ts` configuration
4. Create `I18nProvider` and add to root layout
5. Create `common.json` with shared strings
6. Create `LanguageSwitcher` component

### Phase 2: Module-by-Module Migration (1-2 weeks)

Migrate one module at a time. Priority order:

1. **Common/Shared UI** — Sidebar, header, buttons, modals
2. **Auth module** — Sign in, forgot/reset password
3. **Dashboard** — Dashboard page
4. **Core feature modules** — Shipments, Containers, etc.
5. **Settings/Profile** — User preferences

### For Each Module

1. Create the namespace JSON file (e.g., `en/shipment.json`)
2. Extract all hardcoded strings from components into the JSON file
3. Replace strings with `t()` calls
4. Replace `toLocaleDateString("en-US", ...)` with `formatDate()`
5. Copy the English JSON to create the Amharic file
6. Test both languages

### Phase 3: Validation & Polish (2-3 days)

1. Run the ESLint rule to find remaining hardcoded strings
2. Run translation completeness tests
3. Get Amharic translations reviewed by native speakers
4. Test RTL layout (if applicable)
5. Test on Capacitor (iOS + Android)

### Migration Commit Strategy

```
chore(i18n): setup i18n infrastructure
feat(i18n): migrate common/shared UI strings
feat(i18n): migrate auth module
feat(i18n): migrate shipment module
feat(i18n): migrate container module
feat(i18n): migrate dashboard module
chore(i18n): add Amharic translations
```

---

## 18. Do's and Don'ts

### DO

- ✅ Always use `t()` for **every** user-facing string (labels, buttons, messages, errors, tooltips, placeholders)
- ✅ Use the `formatDate()`, `formatNumber()`, `formatCurrency()` utilities instead of `toLocaleDateString()`
- ✅ Keep translation files sorted alphabetically
- ✅ Use namespaces — one per feature module
- ✅ Add English translations first, then create placeholders for other languages
- ✅ Test the app in all supported languages before merging
- ✅ Use the `Trans` component for strings with embedded JSX
- ✅ Keep translations flat (max 2 levels of nesting)
- ✅ Use logical CSS properties (`ms-*`, `me-*`, `ps-*`, `pe-*`) for RTL support

### DON'T

- ❌ Never hardcode user-facing strings: `<button>Submit</button>`
- ❌ Never concatenate translated strings: `t("hello") + " " + t("world")` — use interpolation instead
- ❌ Never put HTML in translation values (use `Trans` component instead)
- ❌ Never use `toLocaleDateString("en-US", ...)` — use `formatDate()` utility
- ❌ Never nest translation keys deeper than 2 levels
- ❌ Never use dynamic keys: `t(\`status\_${status}\`)` — use a mapping object instead
- ❌ Never translate: log messages, `console.log`, `data-testid`, CSS class names, API keys, enum values
- ❌ Never use Google Translate for production translations — get professional/native translations

### Handling Dynamic Keys Safely

```tsx
// ❌ BAD — Dynamic key, hard to track, may break
t(`status.${shipment.status}`);

// ✅ GOOD — Explicit mapping, type-safe, traceable
const STATUS_KEYS: Record<ShipmentStatus, string> = {
  pending: "common:status.pending",
  active: "common:status.active",
  completed: "common:status.completed",
  cancelled: "common:status.cancelled",
};

t(STATUS_KEYS[shipment.status]);
```

---

## 19. Appendix: Full Example

### Before (Hardcoded)

```tsx
export function ShipmentList({ shipments }) {
  return (
    <div>
      <h1>My Shipments</h1>
      <p>You have {shipments.length} shipments</p>
      {shipments.length === 0 ? (
        <p>No shipments found</p>
      ) : (
        shipments.map((s) => (
          <div key={s.id}>
            <span>
              {s.origin} → {s.destination}
            </span>
            <span>{new Date(s.date).toLocaleDateString("en-US")}</span>
            <span>ETB {s.price.toLocaleString()}</span>
            <span>{s.status}</span>
            <button>View Details</button>
          </div>
        ))
      )}
    </div>
  );
}
```

### After (Multilingual)

```tsx
import { useTranslation } from "react-i18next";
import { formatDate, formatCurrency } from "@/lib/format";

const STATUS_KEYS: Record<string, string> = {
  pending: "common:status.pending",
  active: "common:status.active",
  completed: "common:status.completed",
  cancelled: "common:status.cancelled",
};

export function ShipmentList({ shipments }) {
  const { t } = useTranslation(["shipment", "common"]);

  return (
    <div>
      <h1>{t("shipment:list.title")}</h1>
      <p>{t("shipment:list.count", { count: shipments.length })}</p>
      {shipments.length === 0 ? (
        <p>{t("common:labels.no_data")}</p>
      ) : (
        shipments.map((s) => (
          <div key={s.id}>
            <span>
              {s.origin} → {s.destination}
            </span>
            <span>{formatDate(s.date)}</span>
            <span>{formatCurrency(s.price, "ETB")}</span>
            <span>{t(STATUS_KEYS[s.status])}</span>
            <button>{t("shipment:list.view_details")}</button>
          </div>
        ))
      )}
    </div>
  );
}
```

---

## Quick Reference Card

| Task                 | How                                                          |
| -------------------- | ------------------------------------------------------------ |
| Translate a string   | `const { t } = useTranslation("namespace"); t("key")`        |
| Multiple namespaces  | `useTranslation(["ns1", "ns2"]); t("ns1:key")`               |
| Interpolation        | `t("key", { name: "John" })` — JSON: `"Hello, {{name}}"`     |
| Pluralization        | `t("key", { count: 5 })` — JSON: `"key_one"` / `"key_other"` |
| JSX in translation   | `<Trans i18nKey="key" components={{ bold: <strong /> }} />`  |
| Format date          | `formatDate(date)` from `@/lib/format`                       |
| Format currency      | `formatCurrency(amount, "ETB")` from `@/lib/format`          |
| Switch language      | `i18n.changeLanguage("am")`                                  |
| Get current language | `i18n.language`                                              |
| Outside React        | `import i18n from "@/i18n"; i18n.t("ns:key")`                |

---

## Contact & Resources

- **i18next Docs:** https://www.i18next.com/
- **react-i18next Docs:** https://react.i18next.com/
- **CLDR Plural Rules:** https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html
- **Tailwind Logical Properties:** https://tailwindcss.com/blog/tailwindcss-v3-3#logical-properties

---

_This guide is a living document. Update it as the i18n strategy evolves._
