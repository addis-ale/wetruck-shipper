import { useQuery } from "@tanstack/react-query";
import { shipmentDocumentsApi } from "../api/shipment-documents.api";

export function useShipmentDocument(
  shipId: number,
  documentId: number,
  enabled = false
) {
  return useQuery({
    queryKey: ["shipment-document", shipId, documentId],
    queryFn: () => shipmentDocumentsApi.get(shipId, documentId),
    enabled,
  });
}
