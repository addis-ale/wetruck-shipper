"use client";

import { useParams, useSearchParams } from "next/navigation";
import { ShipmentQuotesDetailView } from "@/app/modules/shipment/ui/views/shipment-quotes-detail-view";

export default function ShipmentQuotesDetailClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const segmentShipId = params?.shipId as string | undefined;
  const queryShipId = searchParams?.get("shipId");
  const shipIdStr =
    segmentShipId === "placeholder" ? queryShipId : segmentShipId;

  if (!shipIdStr) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Invalid shipment ID
      </div>
    );
  }

  const shipId = parseInt(shipIdStr, 10);
  if (isNaN(shipId)) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Invalid shipment ID
      </div>
    );
  }

  return <ShipmentQuotesDetailView shipId={shipId} />;
}
