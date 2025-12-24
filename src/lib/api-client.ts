const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Debug: Log the API URL in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("🔗 API URL:", API_URL);
}

export type ApiResponse<T> = {
  data?: T;
  error?: string;
  status: number;
};

// Prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Attempts to refresh the access token using the stored refresh token
 * @returns New access token or null if refresh failed
 */
async function refreshAccessToken(): Promise<string | null> {
  // If already refreshing, wait for that promise to resolve
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      const refreshToken =
        typeof window !== "undefined"
          ? localStorage.getItem("wetruck_refresh_token")
          : null;

      if (!refreshToken) {
        console.warn("⚠️ No refresh token available");
        return null;
      }

      console.log("🔄 Attempting to refresh access token...");

      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        console.error("❌ Token refresh failed:", response.status);
        return null;
      }

      const data = await response.json();

      if (data.access_token) {
        console.log("✅ Token refreshed successfully");

        // Update stored token
        if (typeof window !== "undefined") {
          localStorage.setItem("wetruck_token", data.access_token);
        }

        return data.access_token;
      }

      return null;
    } catch (error) {
      console.error("❌ Token refresh error:", error);
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Logs out the user by clearing all tokens and redirecting to sign-in
 */
function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("wetruck_token");
    localStorage.removeItem("wetruck_refresh_token");
    localStorage.removeItem("wetruck_user");
    window.location.href = "/sign-in";
  }
}

/**
 * Makes an authenticated API request with automatic token refresh
 */
export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<ApiResponse<T>> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("wetruck_token")
      : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const url = `${API_URL}${endpoint}`;

    // Debug logging in development
    if (process.env.NODE_ENV === "development") {
      console.log("📡 Request:", options.method || "GET", url);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const status = response.status;

    // Handle 401 Unauthorized - Try to refresh token
    if (status === 401 && !isRetry && endpoint !== "/auth/refresh") {
      console.log("🔐 Received 401, attempting token refresh...");

      const newToken = await refreshAccessToken();

      if (newToken) {
        // Retry the original request with the new token
        console.log("🔁 Retrying original request with new token...");
        return request<T>(endpoint, options, true); // Mark as retry to prevent infinite loop
      } else {
        // Refresh failed - logout user
        console.error("❌ Token refresh failed, logging out...");
        logout();
        return {
          error: "Session expired. Please log in again.",
          status: 401,
        };
      }
    }

    const result = await response.json();

    if (!response.ok) {
      return {
        error: result.detail || result.message || "Something went wrong",
        status,
      };
    }

    return { data: result as T, status };
  } catch (error) {
    console.error("❌ API Request Failed:", error);

    let errorMessage = "Network error - Unable to connect to server";

    if (error instanceof TypeError) {
      errorMessage = "Cannot connect to backend. Is the server running?";
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      error: errorMessage,
      status: 500,
    };
  }
}
