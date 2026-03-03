"use client";

import { useQuery } from "@tanstack/react-query";
import { shipmentApi } from "@/app/modules/shipment/server/api/shipment.api";

export function useTrackShipment(shipId: number | null) {
    return useQuery({
        queryKey: ["shipment-tracking", shipId],
        queryFn: () => shipmentApi.trackForShipper(shipId!),
        enabled: shipId !== null && shipId !== undefined,
    });
}
