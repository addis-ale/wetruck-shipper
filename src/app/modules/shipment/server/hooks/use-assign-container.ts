"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { shipmentApi } from "@/app/modules/shipment/server/api/shipment.api";
import type { Container } from "@/app/modules/container/server/types/container.types";
import type { ContainerListResponse } from "@/lib/zod/container.schema";

interface UseAssignContainersOptions {
  onSuccess?: () => void;
  shipmentId?: number;
}

function findContainersByIds(
  queryClient: ReturnType<typeof useQueryClient>,
  containerIds: number[],
): Container[] {
  const idSet = new Set(containerIds);
  const found = new Map<number, Container>();
  const queries = queryClient.getQueriesData<ContainerListResponse>({
    queryKey: ["containers"],
  });
  for (const [, data] of queries) {
    if (!data?.items) continue;
    for (const c of data.items) {
      if (idSet.has(c.id) && !found.has(c.id)) found.set(c.id, c);
    }
    if (found.size === idSet.size) break;
  }
  return containerIds.map((id) => found.get(id)).filter(Boolean) as Container[];
}

export function useAssignContainers(options?: UseAssignContainersOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      shipmentId,
      containerIds,
    }: {
      shipmentId: number;
      containerIds: number[];
    }) => shipmentApi.assignContainers(shipmentId, containerIds),
    onMutate: async (variables) => {
      const { shipmentId, containerIds } = variables;
      await queryClient.cancelQueries({ queryKey: ["containers"] });

      const assignedQueryKey = ["containers", { ship_id: shipmentId }] as const;
      const previousAssigned =
        queryClient.getQueryData<ContainerListResponse>(assignedQueryKey);

      const containersToAdd = findContainersByIds(queryClient, containerIds);
      const newItems = containersToAdd.map((c) => ({
        ...c,
        ship_id: shipmentId,
      }));

      queryClient.setQueryData<ContainerListResponse>(
        assignedQueryKey,
        (old) => {
          if (!old) {
            return {
              items: newItems,
              total: newItems.length,
              page: 1,
              per_page: 100,
            };
          }
          const existingIds = new Set(old.items.map((c) => c.id));
          const added = newItems.filter((c) => !existingIds.has(c.id));
          return {
            ...old,
            items: [...old.items, ...added],
            total: (old.total ?? old.items.length) + added.length,
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
      toast.error(error.message || "Failed to assign containers");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      queryClient.invalidateQueries({ queryKey: ["containers"] });
      toast.success("Containers assigned successfully");
      options?.onSuccess?.();
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["containers", { ship_id: variables.shipmentId }],
      });
    },
  });
}
