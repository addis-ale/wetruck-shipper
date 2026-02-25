"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { shipmentApi } from "@/app/modules/shipment/server/api/shipment.api";

interface UseRequestPriceOptions {
  onSuccess?: (shipmentId: number) => void;
  onError?: (error: Error, shipmentId: number) => void;
}

export function useRequestPrice(options?: UseRequestPriceOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shipmentId: number) => shipmentApi.requestPrice(shipmentId),
    onSuccess: (data, shipmentId) => {
      // Invalidate shipment queries to refetch with updated status
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      queryClient.invalidateQueries({ queryKey: ["shipment", shipmentId] });

      toast.success("Price request submitted successfully");
      options?.onSuccess?.(shipmentId);
    },
    onError: (error: Error, shipmentId: number) => {
      toast.error(error.message || "Failed to request price", {
        duration: 8000,
      });
      options?.onError?.(error, shipmentId);
    },
  });
}
