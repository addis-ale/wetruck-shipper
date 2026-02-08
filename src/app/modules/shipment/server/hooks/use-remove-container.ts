"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { shipmentApi } from "@/app/modules/shipment/server/api/shipment.api";
import type { ContainerListResponse } from "@/lib/zod/container.schema";

interface UseRemoveContainerOptions {
  onSuccess?: () => void;
}

export function useRemoveContainer(options?: UseRemoveContainerOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      shipmentId,
      containerId,
    }: {
      shipmentId: number;
      containerId: number;
    }) => shipmentApi.removeContainer(shipmentId, containerId),
    onMutate: async (variables) => {
      const { shipmentId, containerId } = variables;
      await queryClient.cancelQueries({ queryKey: ["containers"] });

      const assignedQueryKey = ["containers", { ship_id: shipmentId }] as const;
      const previousAssigned =
        queryClient.getQueryData<ContainerListResponse>(assignedQueryKey);

      queryClient.setQueryData<ContainerListResponse>(
        assignedQueryKey,
        (old) => {
          if (!old?.items) return old;
          const items = old.items.filter((c) => c.id !== containerId);
          return {
            ...old,
            items,
            total: Math.max(0, (old.total ?? old.items.length) - 1),
          };
        },
      );

      return { previousAssigned };
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousAssigned !== undefined) {
        queryClient.setQueryData(
          ["containers", { ship_id: variables.shipmentId }],
          context.previousAssigned,
        );
      }
      toast.error(error.message || "Failed to remove container");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      queryClient.invalidateQueries({ queryKey: ["containers"] });
      toast.success("Container removed successfully");
      options?.onSuccess?.();
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["containers", { ship_id: variables.shipmentId }],
      });
    },
  });
}
