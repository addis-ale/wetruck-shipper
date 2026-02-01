"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { shipmentApi } from "@/app/modules/shipment/server/api/shipment.api";
import { toast } from "sonner";

export function useCompleteShipItem(shipId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shipItemId: number) =>
      shipmentApi.completeShipItem(shipItemId),
    onSuccess: (_, shipItemId) => {
      queryClient.invalidateQueries({
        queryKey: ["accepted-ship-items", shipId],
      });
      queryClient.invalidateQueries({
        queryKey: ["ship-item-documents", shipItemId],
      });
      queryClient.invalidateQueries({
        queryKey: ["ship-item-detail", shipItemId],
      });
      queryClient.invalidateQueries({ queryKey: ["shipper-ship-items"] });
      toast.success("Ship item marked as completed");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to mark ship item as completed");
    },
  });
}
