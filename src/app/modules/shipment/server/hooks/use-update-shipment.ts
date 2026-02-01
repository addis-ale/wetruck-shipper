"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { shipmentApi } from "@/app/modules/shipment/server/api/shipment.api";
import type { UpdateShipmentPayload } from "@/app/modules/shipment/server/types/shipment.types";

interface UseUpdateShipmentOptions {
  onSuccess?: () => void;
}

export function useUpdateShipment(id: number, options?: UseUpdateShipmentOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateShipmentPayload) => shipmentApi.update(id, data),
    onSuccess: () => {
      // Invalidate specific shipment and list queries
      queryClient.invalidateQueries({ queryKey: ["shipments", id] });
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      
      toast.success("Shipment updated successfully");
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      // Display error message - toast supports multi-line messages
      const errorMessage = error.message || "Failed to update shipment";
      toast.error(errorMessage, {
        duration: 5000, // Show for 5 seconds to allow reading
      });
    },
  });
}
