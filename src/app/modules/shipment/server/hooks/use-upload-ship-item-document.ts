import { useMutation, useQueryClient } from "@tanstack/react-query";
import { shipItemDocumentsApi } from "../api/ship-item-documents.api";
import type { ShipItemDocument } from "../types/ship-item-document";

type UploadPayload = {
  document_type: string;
  file: File;
};

export function useUploadShipItemDocument(shipItemId: number) {
  const qc = useQueryClient();

  return useMutation<ShipItemDocument, Error, UploadPayload>({
    mutationFn: (payload) =>
      shipItemDocumentsApi.upload(shipItemId, payload),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["ship-item-documents", shipItemId],
      });
    },
  });
}
