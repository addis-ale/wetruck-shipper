import { useQuery } from "@tanstack/react-query";
import { shipItemDocumentsApi } from "../api/ship-item-documents.api";

export function useShipItemDocument(
  shipItemId: number,
  documentId: number | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: ["ship-item-document", shipItemId, documentId],
    queryFn: () =>
      shipItemDocumentsApi.get(shipItemId, documentId!),
    enabled: enabled && !!documentId,
  });
}
