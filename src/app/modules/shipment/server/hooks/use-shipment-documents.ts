import { useQuery } from "@tanstack/react-query";
import { shipmentDocumentsApi } from "../api/shipment-documents.api";
import type { ShipmentDocument } from "../types/shipment-document";

export function useShipmentDocuments(shipId?: number) {
  return useQuery<ShipmentDocument[]>({
    queryKey: ["shipment-documents", shipId],
    enabled: !!shipId,
    queryFn: () => shipmentDocumentsApi.list(shipId!),
  });
}
