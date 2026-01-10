// Support both NEXT_PUBLIC_API_URL and NEXT_PUBLIC_API_BASE_URL for compatibility
const envApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
// If the env var includes /api/v1, use it as-is, otherwise add /api/v1
const baseUrl = envApiUrl || 'http://localhost:8000';
const apiBaseUrl = baseUrl.includes('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;

const API_URL = apiBaseUrl;

// Debug: Log the API URL in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("🔗 API URL:", API_URL);
}

export type ApiResponse<T> = {
  data?: T;
  error?: string;
  status: number;
};

/**
 * Logs out the user by clearing local data and redirecting
 */
async function logout() {
  if (typeof window !== "undefined") {
    // Clear local user data
    localStorage.removeItem("wetruck_user");

    // Only redirect if not already on sign-in page (prevent infinite loop)
    if (!window.location.pathname.includes("/sign-in")) {
      window.location.href = "/sign-in";
    }
  }
}

/**
 * Attempts to refresh the access token using the refresh_token cookie
 * @returns true if refresh successful, false otherwise
 */
async function tryRefreshToken(): Promise<boolean> {
  try {
    console.log(" Attempting to refresh access token...");
    
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include", 
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      console.log(" Token refreshed successfully");
      return true;
    } else {
      console.warn(" Token refresh failed:", response.status);
      return false;
    }
  } catch (error) {
    console.error(" Token refresh error:", error);
    return false;
  }
}

/**
 * Makes an authenticated API request with automatic token refresh
 * Uses HttpOnly cookies for authentication (no Authorization header needed)
 */
export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  try {
    const url = `${API_URL}${endpoint}`;

    // Debug logging in development
    if (process.env.NODE_ENV === "development") {
      console.log(" Request:", options.method || "GET", url);
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include", 
    });

    const status = response.status;

    // Handle 401 Unauthorized - Try to refresh token first
    if (status === 401 && !isRetry) {
      console.warn(" Received 401 - Access token expired or invalid");

      // Don't try refresh on login/refresh endpoints (that's just invalid credentials)
      const isAuthEndpoint = endpoint === "/auth/login" || endpoint === "/auth/refresh";

      if (!isAuthEndpoint) {
        // Try to refresh the token
        const refreshed = await tryRefreshToken();

        if (refreshed) {
          // Token refreshed! Retry the original request
          console.log(" Retrying original request with new token...");
          return request<T>(endpoint, options, true); 
        } else {
          // Refresh failed - logout
          console.log(" Refresh failed - logging out...");
          await logout();
        }
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
    console.error(" API Request Failed:", error);

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
