// shipment/server/types/shipment-document.ts

export interface ShipmentDocument {
  id: number;

  ship_id?: number;

  document_type: string;
  status?: "pending" | "approved" | "rejected";

  file_path: string;
  file_ext?: string;

  expired_at?: string | null;
  rejection_reason?: string | null;

  presigned_url?: string | null;

  created_at: string;
  updated_at?: string;
}
