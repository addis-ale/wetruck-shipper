import { getAuthToken } from "@/lib/auth-token";

const rawEnvApiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000";

// Normalize: remove trailing slash
const normalizedBase = rawEnvApiUrl.replace(/\/$/, "");

// Ensure `/api/v1` exists exactly once
export const API_URL = normalizedBase.endsWith("/api/v1")
  ? normalizedBase
  : `${normalizedBase}/api/v1`;

// Debug log (browser only)
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("🔗 API BASE URL:", API_URL);
}

export type ApiResponse<T> = {
  data?: T;
  error?: string;
  status: number;
};

async function logout() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("wettruck_user");
  localStorage.removeItem("wettruck_access_token");
  localStorage.removeItem("wettruck_refresh_token");

  if (!window.location.pathname.includes("/sign-in")) {
    window.location.href = "/sign-in";
  }
}

async function tryRefreshToken(): Promise<boolean> {
  try {
    console.log("🔄 Refreshing access token (cookie-based)…");

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      console.warn(" Refresh failed:", response.status);
      return false;
    }

    const data = await response.json();

    if (data.access_token) {
      localStorage.setItem("wettruck_access_token", data.access_token);
    }
    if (data.refresh_token) {
      localStorage.setItem("wettruck_refresh_token", data.refresh_token);
    }

    console.log(" Token refreshed");
    return true;
  } catch (err) {
    console.error(" Refresh error:", err);
    return false;
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  if (process.env.NODE_ENV === "development") {
    console.log("➡️ API Request:", options.method || "GET", url);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    // Handle expired access token
    if (response.status === 401 && !isRetry) {
      const isAuthEndpoint =
        endpoint === "/auth/login" || endpoint === "/auth/refresh";

      if (!isAuthEndpoint) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          return request<T>(endpoint, options, true);
        }
        await logout();
      }
    }

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        error: result?.detail || result?.message || "Request failed",
        status: response.status,
      };
    }

    return {
      data: result as T,
      status: response.status,
    };
  } catch (err) {
    console.error("API fetch failed:", err);

    return {
      error: "Cannot connect to backend. Is the server running?",
      status: 500,
    };
  }
}
