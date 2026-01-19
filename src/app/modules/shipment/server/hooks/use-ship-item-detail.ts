"use client";

import { useQuery } from "@tanstack/react-query";
import { shipmentApi } from "@/app/modules/shipment/server/api/shipment.api";

export function useShipItemDetail(shipItemId: number | null) {
  return useQuery({
    queryKey: ["ship-item-detail", shipItemId],
    queryFn: () => shipmentApi.getShipItemByIdForShipper(shipItemId!),
    enabled: !!shipItemId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

