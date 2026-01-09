import { useQuery } from "@tanstack/react-query";
import { shipItemDocumentsApi } from "../api/ship-item-documents.api";

export function useShipItemDocuments(shipItemId: number) {
  return useQuery({
    queryKey: ["ship-item-documents", shipItemId],
    queryFn: () => shipItemDocumentsApi.list(shipItemId),
  });
}
