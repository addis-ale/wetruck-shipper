"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { shipmentApi } from "@/app/modules/shipment/server/api/shipment.api";
import type { CreateShipmentPayload } from "@/app/modules/shipment/server/types/shipment.types";

interface UseCreateShipmentOptions {
  onSuccess?: (shipmentId: number) => void;
}

export function useCreateShipment(options?: UseCreateShipmentOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateShipmentPayload) => shipmentApi.create(data),
    onSuccess: (data) => {
      // Invalidate all shipment queries to refetch
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      
      toast.success("Shipment created successfully");
      options?.onSuccess?.(data.id);
    },
    onError: (error: Error) => {
      // Display error message - toast supports multi-line messages
      const errorMessage = error.message || "Failed to create shipment";
      toast.error(errorMessage, {
        duration: 5000, // Show for 5 seconds to allow reading
      });
    },
  });
}
