"use client";

import { useParams, useSearchParams } from "next/navigation";
import { ShipmentDetailView } from "@/app/modules/shipment/ui/views/shipment-detail-view";

export default function ShipmentDetailClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const segmentId = params?.id as string | undefined;
  const queryId = searchParams?.get("id");
  const id = segmentId === "placeholder" ? queryId : segmentId;

  if (!id) {
    return (
      <div className="p-6">
        <p className="text-destructive">Invalid shipment ID: No ID provided</p>
      </div>
    );
  }

  const shipmentId = parseInt(id, 10);
  if (isNaN(shipmentId) || shipmentId <= 0) {
    return (
      <div className="p-6">
        <p className="text-destructive">
          Invalid shipment ID: &quot;{id}&quot; is not a valid number
        </p>
      </div>
    );
  }

  return <ShipmentDetailView shipmentId={shipmentId} />;
}
