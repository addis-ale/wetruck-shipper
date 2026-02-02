import type { ShipmentDocument } from "../types/shipment-document";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const API_PREFIX = "/api/v1";
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
  const url = `${BASE_URL.replace(/\/api\/v1\/?$/, "")}${API_PREFIX}${endpoint}`;
  console.log(`[shipmentDocumentsApi] Requesting: ${options.method || "GET"} ${url}`);

  const res = await fetch(url, {
    ...options,
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error(`[shipmentDocumentsApi] Request failed for ${url}:`, err);
    throw new Error(err?.detail || err?.message || "Request failed");
  }

  if (res.status === 204) return {} as T;
  const data = await res.json();
  console.log(`[shipmentDocumentsApi] Response for ${url}:`, data);
  return data;
}

export const shipmentDocumentsApi = {
  async list(shipId: number): Promise<ShipmentDocument[]> {
    console.log(`[shipmentDocumentsApi.list] shipId: ${shipId}`);
    const res = await apiRequest<ShipmentDocumentListResponse>(
      `${API_PATH}/${shipId}/documents/`
    );
    return res.items ?? [];
  },

  async get(
    shipId: number,
    documentId: number
  ): Promise<ShipmentDocument> {
    return apiRequest<ShipmentDocument>(
      `${API_PATH}/${shipId}/documents/${documentId}`
    );
  },

  upload(
    shipId: number,
    payload: { document_type: string; file: File }
  ): Promise<ShipmentDocument> {
    const fd = new FormData();
    fd.append("document_type", payload.document_type);
    fd.append("file", payload.file);

    return apiRequest<ShipmentDocument>(
      `${API_PATH}/${shipId}/documents/`,
      {
        method: "POST",
        body: fd,
      }
    );
  },

  delete(
    shipId: number,
    documentId: number
  ): Promise<ShipmentDocument> {
    return apiRequest<ShipmentDocument>(
      `${API_PATH}/${shipId}/documents/${documentId}`,
      { method: "DELETE" }
    );
  },
};
