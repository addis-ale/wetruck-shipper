import { useMutation, useQueryClient } from "@tanstack/react-query";
import { shipmentDocumentsApi } from "../api/shipment-documents.api";

type UploadShipmentDocumentPayload = {
  document_type: string;
  file: File;
};

export function useUploadShipmentDocument(shipId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UploadShipmentDocumentPayload) =>
      shipmentDocumentsApi.upload(shipId, payload),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["shipment-documents"],
      });
    },
  });
}
