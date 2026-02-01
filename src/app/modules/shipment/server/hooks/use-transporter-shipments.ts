"use client";

import { useQuery } from "@tanstack/react-query";
import { shipmentApi } from "@/app/modules/shipment/server/api/shipment.api";
import type { ShipItem } from "@/lib/zod/shipment.schema";

type ShipItemsListResponse = {
  status: boolean;
  message?: string;
  total: number;
  page: number;
  per_page: number;
  pages: number;
  items: ShipItem[];
};

type ShipperShipItemsListResponse = {
  status: boolean;
  message?: string;
  total: number;
  page: number;
  per_page: number;
  pages: number;
  items: Array<{
    transporter_id: number;
    ship_items: ShipItem[];
    total_price: number;
    total_containers: number;
    currency: string;
  }>;
};

interface UseShipItemsParams {
  page?: number;
  per_page?: number;
  ship_id?: number;
  transporter_id?: number;
  status?: "created" | "accepted_by_shipper" | "rejected_by_shipper";
}

export function useShipItems(params?: UseShipItemsParams) {
  return useQuery<ShipItemsListResponse>({
    queryKey: ["ship-items", params],
    queryFn: () => shipmentApi.getShipItems(params),
    enabled: params !== undefined, // Only fetch when params are provided
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

// Keep the old hook name for backward compatibility
export const useTransporterShipments = useShipItems;

// Hook for shipper ship items (grouped by transporter)
export function useShipperShipItems(params?: {
  page?: number;
  per_page?: number;
  ship_id?: number;
}) {
  return useQuery<ShipperShipItemsListResponse>({
    queryKey: ["shipper-ship-items", params],
    queryFn: () => shipmentApi.getShipItemsForShipper(params),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

