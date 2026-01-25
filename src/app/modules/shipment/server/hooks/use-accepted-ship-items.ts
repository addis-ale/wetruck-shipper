"use client";

import { useQuery } from "@tanstack/react-query";
import { shipmentApi } from "@/app/modules/shipment/server/api/shipment.api";
import type { ShipItem } from "@/lib/zod/shipment.schema";

export function useAcceptedShipItems(shipId: number | null) {
  return useQuery<ShipItem[]>({
    queryKey: ["accepted-ship-items", shipId],
    queryFn: () => shipmentApi.getAcceptedShipItems(shipId!),
    enabled: !!shipId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

