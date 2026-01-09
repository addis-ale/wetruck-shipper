import { useMutation, useQueryClient } from "@tanstack/react-query";
import { shipItemDocumentsApi } from "../api/ship-item-documents.api";

export function useDeleteShipItemDocument(shipItemId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (documentId: number) =>
      shipItemDocumentsApi.delete(shipItemId, documentId),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["ship-item-documents", shipItemId],
      }),
  });
}
