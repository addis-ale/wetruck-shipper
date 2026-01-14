"use client";

import { useQuery } from "@tanstack/react-query";
import { shipmentApi } from "@/app/modules/shipment/server/api/shipment.api";

export function useTransporterShipment(id: number | null) {
  return useQuery({
    queryKey: ["transporter-shipment", id],
    queryFn: () => shipmentApi.getByTransporter(id!),
    enabled: id !== null && id !== undefined,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });
}

