"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { shipmentApi } from "@/app/modules/shipment/server/api/shipment.api";

interface UseGetPriceOptions {
  onSuccess?: (data: { price: number; currency?: string }) => void;
}

export function useGetPrice(options?: UseGetPriceOptions) {
  return useMutation({
    mutationFn: ({ shipmentId, containerIds }: { shipmentId: number; containerIds: number[] }) =>
      shipmentApi.getPrice(shipmentId, containerIds),
    onSuccess: (data) => {
      const currency = data.currency || "ETB";
      toast.success(`Price: ${data.price.toLocaleString()} ${currency}`);
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to get price");
    },
  });
}

