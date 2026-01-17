"use client";

import { useQuery } from "@tanstack/react-query";
import { shipmentApi } from "@/app/modules/shipment/server/api/shipment.api";

export function useShipment(id: number | null) {
  return useQuery({
    queryKey: ["shipments", id],
    queryFn: () => shipmentApi.getById(id!),
    enabled: id !== null && id !== undefined,
  });
}
