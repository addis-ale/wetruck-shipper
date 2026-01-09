"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { shipmentApi } from "@/app/modules/shipment/server/api/shipment.api";

interface UseRemoveContainerOptions {
  onSuccess?: () => void;
}

export function useRemoveContainer(options?: UseRemoveContainerOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shipmentId, containerId }: { shipmentId: number; containerId: number }) =>
      shipmentApi.removeContainer(shipmentId, containerId),
    onSuccess: (_, variables) => {
      // Invalidate and refetch shipments
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      
      // Force refetch all container queries
      queryClient.invalidateQueries({ queryKey: ["containers"] });
      queryClient.refetchQueries({ queryKey: ["containers"] });
      
      // Specifically refetch containers for this shipment
      queryClient.refetchQueries({ 
        queryKey: ["containers", { ship_id: variables.shipmentId }] 
      });
      
      toast.success("Container removed successfully");
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove container");
    },
  });
}
