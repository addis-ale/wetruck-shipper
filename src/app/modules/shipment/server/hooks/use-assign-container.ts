"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { shipmentApi } from "@/app/modules/shipment/server/api/shipment.api";

interface UseAssignContainersOptions {
  onSuccess?: () => void;
  shipmentId?: number;
}

export function useAssignContainers(options?: UseAssignContainersOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shipmentId, containerIds }: { shipmentId: number; containerIds: number[] }) =>
      shipmentApi.assignContainers(shipmentId, containerIds),
    onSuccess: (_, variables) => {
      // Invalidate and refetch shipments
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      
      // Force refetch all container queries (with and without ship_id filter)
      queryClient.invalidateQueries({ queryKey: ["containers"] });
      queryClient.refetchQueries({ queryKey: ["containers"] });
      
      // Specifically refetch containers for this shipment
      if (variables.shipmentId) {
        queryClient.refetchQueries({ 
          queryKey: ["containers", { ship_id: variables.shipmentId }] 
        });
      }
      
      toast.success("Containers assigned successfully");
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to assign containers");
    },
  });
}
