import i18n from "@/i18n";

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

export function formatDateShort(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const locale = i18n.language;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    ...options,
  };
  return d.toLocaleDateString(locale, defaultOptions);
}

export function formatDateLong(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const locale = i18n.language;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  };
  return d.toLocaleDateString(locale, defaultOptions);
}

export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  const locale = i18n.language;
  return new Intl.NumberFormat(locale, options).format(value);
}

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
