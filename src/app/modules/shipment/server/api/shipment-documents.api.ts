import type { ShipmentDocument } from "../types/shipment-document";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const API_PATH = "/ship";

type ShipmentDocumentListResponse = {
  status: boolean;
  message: string | null;
  total: number;
  page: number;
  per_page: number;
  pages: number;
  items: ShipmentDocument[];
};

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || err?.message || "Request failed");
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

export const shipmentDocumentsApi = {
  // ✅ LIST → returns ARRAY (items)
  async list(shipId: number): Promise<ShipmentDocument[]> {
    const res = await apiRequest<ShipmentDocumentListResponse>(
      `${API_PATH}/${shipId}/documents`
    );
    return res.items ?? [];
  },

  // ✅ UPLOAD
  upload(
    shipId: number,
    payload: { document_type: string; file: File }
  ): Promise<ShipmentDocument> {
    const fd = new FormData();
    fd.append("document_type", payload.document_type);
    fd.append("file", payload.file);

    return apiRequest(`${API_PATH}/${shipId}/documents`, {
      method: "POST",
      body: fd,
    });
  },

  // ✅ DELETE
  delete(shipId: number, documentId: number): Promise<void> {
    return apiRequest(
      `${API_PATH}/${shipId}/documents/${documentId}`,
      { method: "DELETE" }
    );
  },
};
