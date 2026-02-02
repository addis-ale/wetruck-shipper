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
  console.log(`[shipItemDocumentsApi] Requesting: ${options.method || "GET"} ${url}`);
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error(`[shipItemDocumentsApi] Request failed for ${url}:`, error);
    throw new Error(error?.detail || "Request failed");
  }

  if (response.status === 204) return {} as T;
  const data = await response.json();
  console.log(`[shipItemDocumentsApi] Response for ${url}:`, data);
  return data;
}

export const shipItemDocumentsApi = {
  /**
   * List all document metadata for a ship item (shipper).
   * GET /api/v1/ship-item/{ship_item_id}/documents/shipper
   * @param shipItemId - Ship item ID
   * @param containerId - Optional filter by container ID
   */
  list(shipItemId: number, containerId?: number): Promise<ShipItemDocument[]> {
    console.log(`[shipItemDocumentsApi.list] shipItemId: ${shipItemId}, containerId: ${containerId}`);
    const params = new URLSearchParams();
    if (containerId != null) {
      params.append("container_id", containerId.toString());
    }

    const queryString = params.toString();
    const endpoint = queryString
      ? `${API_PATH}/${shipItemId}/documents/shipper?${queryString}`
      : `${API_PATH}/${shipItemId}/documents/shipper`;

    return apiRequest<ShipItemDocument[]>(endpoint);
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

  async get(
    shipItemId: number,
    documentId: number,
    containerId?: number,
  ): Promise<{
    id: number;
    document_type: string;
    presigned_url: string;
  }> {
    // Re-implementing get to use the allowed list/shipper endpoint
    // to avoid the 403 Forbidden error on the direct direct document ID endpoint.
    console.log(`[shipItemDocumentsApi.get] shipItemId: ${shipItemId}, documentId: ${documentId}, containerId: ${containerId}`);
    const documents = await this.list(shipItemId, containerId);
    const doc = documents.find((d) => d.id === documentId);

    if (!doc) {
      console.error(`[shipItemDocumentsApi.get] Document ${documentId} not found in shipper list for shipItem ${shipItemId}`);
      throw new Error("Document not found");
    }

    if (!doc.presigned_url) {
      console.error(`[shipItemDocumentsApi.get] Document ${documentId} found but no presigned_url available`);
      throw new Error("Presigned URL not available for this document");
    }

    return {
      id: doc.id,
      document_type: doc.document_type,
      presigned_url: doc.presigned_url,
    };
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
