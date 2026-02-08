"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
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

      options?.onSuccess?.(shipmentId);
    },
    onError: (error: Error) => {
      // Error will be handled in the UI component
    },
  });
}

