"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { shipmentApi } from "@/app/modules/shipment/server/api/shipment.api";
import { toast } from "sonner";

export function useAcceptShipItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shipItemId: number) => shipmentApi.acceptShipItem(shipItemId),
    onSuccess: () => {
      // Invalidate and refetch shipper ship items
      queryClient.invalidateQueries({ queryKey: ["shipper-ship-items"] });
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      toast.success("Quote accepted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to accept quote");
    },
  });
}

