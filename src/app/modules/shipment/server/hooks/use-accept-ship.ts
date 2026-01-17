"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { shipmentApi } from "@/app/modules/shipment/server/api/shipment.api";
import type { ShipmentListResponse } from "@/lib/zod/shipment.schema";
import { toast } from "sonner";

export function useAcceptShip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shipId, shipItemIds }: { shipId: number; shipItemIds: number[] }) =>
      shipmentApi.acceptShip(shipId, shipItemIds),
    onMutate: async ({ shipId }) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ["shipments"] });
      await queryClient.cancelQueries({ queryKey: ["shipper-ship-items"] });

      // Snapshot the previous value for all shipments queries
      const previousShipmentsQueries = queryClient.getQueriesData<ShipmentListResponse>({
        queryKey: ["shipments"],
      });

      // Optimistically update all shipments queries to mark the shipment as accepted
      queryClient.setQueriesData<ShipmentListResponse>(
        { queryKey: ["shipments"] },
        (old) => {
          if (!old?.items) return old;
          return {
            ...old,
            items: old.items.map((shipment) =>
              shipment.id === shipId
                ? { ...shipment, status: "accepted_by_shipper" as const }
                : shipment
            ),
          };
        }
      );

      // Return context with previous values for rollback
      return { previousShipmentsQueries };
    },
    onError: (error: Error, variables, context) => {
      // If the mutation fails, roll back to the previous values
      if (context?.previousShipmentsQueries) {
        context.previousShipmentsQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || "Failed to accept shipment");
    },
    onSuccess: (data) => {
      // Invalidate and refetch to ensure we have the latest data from the server
      queryClient.invalidateQueries({ queryKey: ["shipper-ship-items"] });
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      const message = data.success_message || "Shipment accepted successfully";
      toast.success(message);
    },
  });
}

