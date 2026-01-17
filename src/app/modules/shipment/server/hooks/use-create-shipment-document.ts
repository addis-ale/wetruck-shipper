import { useMutation, useQueryClient } from "@tanstack/react-query";
import { shipmentDocumentsApi } from "../api/shipment-documents.api";

export function useCreateShipmentDocument(shipId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: { document_type: string; file: File }) =>
      shipmentDocumentsApi.upload(shipId, payload),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shipment-documents"] });
    },
  });
}
