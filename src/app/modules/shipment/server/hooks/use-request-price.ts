"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { shipmentApi } from "@/app/modules/shipment/server/api/shipment.api";

interface UseRequestPriceOptions {
  onSuccess?: (shipmentId: number) => void;
}

export function useRequestPrice(options?: UseRequestPriceOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shipmentId: number) => shipmentApi.requestPrice(shipmentId),
    onSuccess: (data, shipmentId) => {
      // Invalidate shipment queries to refetch with updated status
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      queryClient.invalidateQueries({ queryKey: ["shipment", shipmentId] });
      
      // Show success message
      const message = data.success_message || "Price request submitted successfully";
      toast.success(message);
      
      options?.onSuccess?.(shipmentId);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to request price");
    },
  });
}

