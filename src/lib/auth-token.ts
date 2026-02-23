/**
 * Single source of truth for the auth token used in API requests.
 * Use this whenever you need to send Authorization: Bearer <token> so that
 * cookie-only auth (e.g. in Capacitor/native) still works.
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  const fromStorage = localStorage.getItem("wetruck_access_token");
  if (fromStorage) return fromStorage;

  const cookies = document.cookie.split(";");
  const tokenCookie = cookies.find((c) => c.trim().startsWith("access_token="));
  return tokenCookie ? (tokenCookie.split("=")[1]?.trim() ?? null) : null;
}

/** Headers object with Authorization Bearer if token exists (for fetch). */
export function getAuthHeaders(
  extra: Record<string, string> = {},
): Record<string, string> {
  const token = getAuthToken();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
