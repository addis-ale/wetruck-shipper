import { useQuery } from "@tanstack/react-query";
import { shipItemDocumentsApi } from "../api/ship-item-documents.api";

export function useShipItemDocumentPreview(
  shipItemId: number,
  documentId: number | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: ["ship-item-document-preview", shipItemId, documentId],
    enabled: enabled && !!documentId,
    queryFn: () =>
      shipItemDocumentsApi.get(shipItemId, documentId!),
  });
}
