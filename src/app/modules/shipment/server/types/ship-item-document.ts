export type ShipItemDocumentType =
  | "proof_of_delivery"
  | "container_return_receipt";

export interface ShipItemDocument {
  id: number;
  document_type: ShipItemDocumentType;
  file_url: string;
  created_at: string;
}
