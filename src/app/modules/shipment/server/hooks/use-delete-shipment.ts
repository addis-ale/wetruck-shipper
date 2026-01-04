"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { shipmentApi } from "@/app/modules/shipment/server/api/shipment.api";
import { useRouter } from "next/navigation";

interface UseDeleteShipmentOptions {
  onSuccess?: () => void;
}

export function useDeleteShipment(options?: UseDeleteShipmentOptions) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (id: number) => shipmentApi.delete(id),
    onSuccess: (_, id) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["shipments", id] });
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      
      toast.success("Shipment deleted successfully");
      options?.onSuccess?.();
      router.push("/dashboard/shipments");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete shipment");
    },
  });
}

