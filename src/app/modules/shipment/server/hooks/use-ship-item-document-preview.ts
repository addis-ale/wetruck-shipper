import { useQuery } from "@tanstack/react-query";
import { shipItemDocumentsApi } from "../api/ship-item-documents.api";

export function useShipItemDocumentPreview(
  shipItemId: number,
  documentId: number | null,
  enabled: boolean,
  containerId?: number,
) {
  return useQuery({
    queryKey: ["ship-item-document-preview", shipItemId, documentId, containerId],
    enabled: enabled && !!documentId,
    queryFn: () => shipItemDocumentsApi.get(shipItemId, documentId!, containerId),
  });
}
