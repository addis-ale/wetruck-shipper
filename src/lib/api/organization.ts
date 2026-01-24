// Support both NEXT_PUBLIC_API_URL and NEXT_PUBLIC_API_BASE_URL for compatibility
const envApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
// If the env var includes /api/v1, use it as-is, otherwise add /api/v1
const baseUrl = envApiUrl || 'http://127.0.0.1:8000';
const apiBaseUrl = baseUrl.includes('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;

const API_URL = apiBaseUrl;

// Debug: Log the API URL in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("🔗 Organization API URL:", API_URL);
}

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
    const tokenCookie = cookies.find((c) => c.trim().startsWith("access_token="));
    if (tokenCookie) {
      return tokenCookie.split("=")[1];
    }
  }
  
  return null;
}

// Helper to get auth headers
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// Helper to parse response text and handle HTML errors
function parseResponse(text: string, endpoint: string): any {
  // Check if response is HTML (404 page) instead of JSON
  if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
    throw new Error(`API endpoint not found. Check if backend is running and URL is correct: ${API_URL}${endpoint}`);
  }
  
  if (!text) return undefined;
  
  try {
    return JSON.parse(text);
  } catch (parseError) {
    throw new Error(`Invalid JSON response from ${endpoint}: ${text.substring(0, 100)}...`);
  }
}

export interface OrganizationDocument {
  id: number;
  document_type: string;
  file_path: string;
  presigned_url?: string; // Pre-signed URL when fetched via GET /{id}/get
  truck_id?: number | null;
  driver_id?: number | null;
  organization_id?: number;
  entity_type?: string;
  status?: string;
  deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateOrganizationDocumentRequest {
  file: File;
  document_type: string;
}

export interface UpdateOrganizationDocumentRequest {
  document_type?: string;
  file?: File; // Optional file for overwrite
}

export interface OrganizationDocumentListResponse {
  items: OrganizationDocument[];
  total?: number;
}

export const organizationApi = {
  /**
   * Upload a document for the organization
   * POST /api/v1/organization/documents
   */
  uploadDocument: async (file: File, documentType: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", documentType);

    const response = await fetch(`${API_URL}/organization/documents`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
      credentials: "include",
    });

    const status = response.status;
    const text = await response.text();
    const result = parseResponse(text, '/organization/documents');

    if (!response.ok) {
      return {
        error: result?.detail || result?.message || "Failed to upload document",
        status,
      };
    }

    return { data: result as OrganizationDocument, status };
  },

  /**
   * List all documents for the organization
   * GET /api/v1/organization/documents/list
   */
  listDocuments: async () => {
    const response = await fetch(`${API_URL}/organization/documents/list`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    const status = response.status;
    const text = await response.text();
    const result = parseResponse(text, '/organization/documents/list');

    if (!response.ok) {
      return {
        error: result?.detail || result?.message || "Failed to get documents",
        status,
      };
    }

    // API might return array directly or wrapped in object
    const items = Array.isArray(result) ? result : result?.items || [];
    return { data: items as OrganizationDocument[], status };
  },

  /**
   * Get a document with pre-signed URL
   * GET /api/v1/organization/documents/{document_id}/get
   */
  getDocument: async (documentId: string | number) => {
    const response = await fetch(
      `${API_URL}/organization/documents/${documentId}/get`,
      {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      }
    );

    const status = response.status;
    const text = await response.text();
    const result = parseResponse(text, `/organization/documents/${documentId}/get`);

    if (!response.ok) {
      return {
        error: result?.detail || result?.message || "Failed to get document",
        status,
      };
    }

    return { data: result as OrganizationDocument, status };
  },

  /**
   * Update document metadata (and optionally overwrite file)
   * PATCH /api/v1/organization/documents/{document_id}/update
   */
  updateDocument: async (
    documentId: string | number,
    data: UpdateOrganizationDocumentRequest
  ) => {
    const formData = new FormData();

    if (data.document_type) {
      formData.append("document_type", data.document_type);
    }
    if (data.file) {
      formData.append("file", data.file);
    }

    const response = await fetch(
      `${API_URL}/organization/documents/${documentId}/update`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: formData,
        credentials: "include",
      }
    );

    const status = response.status;
    const text = await response.text();
    const result = parseResponse(text, `/organization/documents/${documentId}/update`);

    if (!response.ok) {
      return {
        error: result?.detail || result?.message || "Failed to update document",
        status,
      };
    }

    return { data: result as OrganizationDocument, status };
  },

  /**
   * Delete a document
   * DELETE /api/v1/organization/documents/{document_id}/delete
   */
  deleteDocument: async (documentId: string | number) => {
    const response = await fetch(
      `${API_URL}/organization/documents/${documentId}/delete`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      }
    );

    const status = response.status;

    if (!response.ok) {
      const text = await response.text();
      const result = parseResponse(text, `/organization/documents/${documentId}/delete`);
      return {
        error: result?.detail || result?.message || "Failed to delete document",
        status,
      };
    }

    return { data: { success: true }, status };
  },
};
