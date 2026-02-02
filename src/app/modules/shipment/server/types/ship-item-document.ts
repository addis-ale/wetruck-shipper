export type ShipItemDocumentType =
  | "proof_of_delivery"
  | "container_return_receipt";

export interface ShipItemDocument {
  id: number;
  ship_item_id: number;
  ship_id: number;
  organization_id: number;
  container_id?: number;

  document_type: string;
  status: "pending" | "approved" | "rejected";

  file_path: string;
  file_ext: string | null;

  rejection_reason: string | null;
  expired_at: string | null;
  presigned_url?: string;

  deleted: boolean;
  created_at: string;
  updated_at: string;
}
