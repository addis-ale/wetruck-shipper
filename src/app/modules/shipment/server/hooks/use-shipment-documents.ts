import { useQuery } from "@tanstack/react-query";
import { shipmentDocumentsApi } from "../api/shipment-documents.api";

export function useShipmentDocuments(shipId: number) {
  return useQuery({
    queryKey: ["shipment-documents", shipId],
    queryFn: () => shipmentDocumentsApi.list(shipId),
    enabled: !!shipId,
  });
}
