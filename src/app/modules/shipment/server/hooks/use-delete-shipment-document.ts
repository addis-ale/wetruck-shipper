import { useMutation, useQueryClient } from "@tanstack/react-query";
import { shipmentDocumentsApi } from "../api/shipment-documents.api";

export function useDeleteShipmentDocument(shipId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (documentId: number) =>
      shipmentDocumentsApi.delete(shipId, documentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shipment-documents", shipId] });
    },
  });
}
