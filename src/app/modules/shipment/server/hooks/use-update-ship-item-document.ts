import { useMutation, useQueryClient } from "@tanstack/react-query";
import { shipItemDocumentsApi } from "../api/ship-item-documents.api";

export function useUpdateShipItemDocument(
  shipItemId: number,
  documentId: number
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      document_type: string;
      file: File;
    }) =>
      shipItemDocumentsApi.update(
        shipItemId,
        documentId,
        payload
      ),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["ship-item-documents", shipItemId],
      });
    },
  });
}
