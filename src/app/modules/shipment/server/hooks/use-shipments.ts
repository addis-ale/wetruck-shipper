"use client";

import { useQuery } from "@tanstack/react-query";
import { shipmentApi } from "@/app/modules/shipment/server/api/shipment.api";
import type { ShipmentListParams } from "@/app/modules/shipment/server/types/shipment.types";

export function useShipments(params?: ShipmentListParams) {
  return useQuery({
    queryKey: ["shipments", params],
    queryFn: () => shipmentApi.getAll(params),
  });
}
