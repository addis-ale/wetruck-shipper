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
 * Gets auth token from localStorage or cookies
 */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  
  // First try localStorage (most reliable for cross-origin requests)
  const localStorageToken = localStorage.getItem("wetruck_access_token");
  if (localStorageToken) {
    return localStorageToken;
  }
  
  // Fallback to cookie
  if (typeof document !== "undefined") {
    const cookies = document.cookie.split(";");
    const tokenCookie = cookies.find((c) => c.trim().startsWith("access_token="));
    if (tokenCookie) {
      return tokenCookie.split("=")[1];
    }
  }
  
  return null;
}

/**
 * Logs out the user by clearing local data and redirecting
 */
async function logout() {
  if (typeof window !== "undefined") {
    // Clear local user data and tokens
    localStorage.removeItem("wetruck_user");
    localStorage.removeItem("wetruck_access_token");
    localStorage.removeItem("wetruck_refresh_token");

    // Only redirect if not already on sign-in page (prevent infinite loop)
    if (!window.location.pathname.includes("/sign-in")) {
      window.location.href = "/sign-in";
    }
  }
}

/**
 * Attempts to refresh the access token using the refresh_token
 * @returns true if refresh successful, false otherwise
 */
async function tryRefreshToken(): Promise<boolean> {
  try {
    console.log("🔄 Attempting to refresh access token...");
    
    // Get refresh token from localStorage
    const refreshToken = typeof window !== "undefined" 
      ? localStorage.getItem("wetruck_refresh_token") 
      : null;
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    // Add refresh token to Authorization header if available
    if (refreshToken) {
      headers["Authorization"] = `Bearer ${refreshToken}`;
    }
    
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include", 
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      
      // Save new tokens to localStorage if provided
      if (data.access_token && typeof window !== "undefined") {
        localStorage.setItem("wetruck_access_token", data.access_token);
      }
      if (data.refresh_token && typeof window !== "undefined") {
        localStorage.setItem("wetruck_refresh_token", data.refresh_token);
      }
      
      console.log("✅ Token refreshed successfully");
      return true;
    } else {
      console.warn("❌ Token refresh failed:", response.status);
      return false;
    }
  } catch (error) {
    console.error("❌ Token refresh error:", error);
    return false;
  }
}

/**
 * Makes an authenticated API request with automatic token refresh
 * Uses both Authorization header and cookies for authentication
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

  // Add Authorization header if token is available
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

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
