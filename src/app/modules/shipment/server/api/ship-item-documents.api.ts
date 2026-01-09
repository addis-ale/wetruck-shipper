import type { ShipItemDocument } from "../types/ship-item-document";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const API_PREFIX = "";
const API_PATH = "/ship-item";

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${BASE_URL}${API_PREFIX}${endpoint}`, {
    ...options,
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
  list(shipItemId: number): Promise<ShipItemDocument[]> {
    return apiRequest(`${API_PATH}/${shipItemId}/documents`);
  },

  upload(
    shipItemId: number,
    payload: { document_type: string; file: File }
  ): Promise<ShipItemDocument> {
    const formData = new FormData();
    formData.append("document_type", payload.document_type);
    formData.append("file", payload.file);

    return apiRequest(`${API_PATH}/${shipItemId}/documents`, {
      method: "POST",
      body: formData,
    });
  },

  delete(shipItemId: number, documentId: number): Promise<void> {
    return apiRequest(
      `${API_PATH}/${shipItemId}/documents/${documentId}`,
      { method: "DELETE" }
    );
  },
};
