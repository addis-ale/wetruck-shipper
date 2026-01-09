const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
      body: formData,
      credentials: "include",
    });

    const status = response.status;
    const text = await response.text();
    const result = text ? JSON.parse(text) : undefined;

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
      credentials: "include",
    });

    const status = response.status;
    const text = await response.text();
    const result = text ? JSON.parse(text) : undefined;

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
        credentials: "include",
      }
    );

    const status = response.status;
    const text = await response.text();
    const result = text ? JSON.parse(text) : undefined;

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
        body: formData,
        credentials: "include",
      }
    );

    const status = response.status;
    const text = await response.text();
    const result = text ? JSON.parse(text) : undefined;

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
        credentials: "include",
      }
    );

    const status = response.status;

    if (!response.ok) {
      const text = await response.text();
      const result = text ? JSON.parse(text) : undefined;
      return {
        error: result?.detail || result?.message || "Failed to delete document",
        status,
      };
    }

    return { data: { success: true }, status };
  },
};
