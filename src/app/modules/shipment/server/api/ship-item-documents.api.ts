import type { ShipItemDocument } from "../types/ship-item-document";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const API_PREFIX = "/api/v1";
const API_PATH = "/ship-item";

// Helper to get auth token from localStorage or cookies
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
    const tokenCookie = cookies.find((c) =>
      c.trim().startsWith("access_token="),
    );
    if (tokenCookie) {
      return tokenCookie.split("=")[1];
    }
  }

  return null;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    ...(options.headers as Record<string, string>),
  };

  // Add Authorization header if token is available
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const url = `${BASE_URL.replace(/\/api\/v1\/?$/, "")}${API_PREFIX}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.detail || "Request failed");
  }

  if (response.status === 204) return {} as T;
  return response.json();
}

export const shipItemDocumentsApi = {
  /**
   * List all document metadata for a ship item (shipper).
   * GET /api/v1/ship-item/{ship_item_id}/documents/shipper
   * @param shipItemId - Ship item ID
   * @param containerId - Optional filter by container ID
   */
  list(shipItemId: number, containerId?: number): Promise<ShipItemDocument[]> {
    const path = `${API_PATH}/${shipItemId}/documents/shipper`;
    const query = containerId != null ? `?container_id=${containerId}` : "";
    return apiRequest<ShipItemDocument[]>(path + query);
  },

  upload(
    shipItemId: number,
    payload: { document_type: string; file: File },
  ): Promise<ShipItemDocument> {
    const formData = new FormData();
    formData.append("document_type", payload.document_type);
    formData.append("file", payload.file);

    return apiRequest(`${API_PATH}/${shipItemId}/documents`, {
      method: "POST",
      body: formData,
    });
  },

  get(
    shipItemId: number,
    documentId: number,
  ): Promise<{
    id: number;
    document_type: string;
    presigned_url: string;
  }> {
    return apiRequest(`${API_PATH}/${shipItemId}/documents/${documentId}`);
  },

  update(
    shipItemId: number,
    documentId: number,
    payload: { document_type: string; file: File },
  ): Promise<ShipItemDocument> {
    const formData = new FormData();
    formData.append("document_type", payload.document_type);
    formData.append("file", payload.file);

    return apiRequest(`${API_PATH}/${shipItemId}/documents/${documentId}`, {
      method: "PATCH",
      body: formData,
    });
  },

  delete(shipItemId: number, documentId: number): Promise<void> {
    return apiRequest(`${API_PATH}/${shipItemId}/documents/${documentId}`, {
      method: "DELETE",
    });
  },
};
