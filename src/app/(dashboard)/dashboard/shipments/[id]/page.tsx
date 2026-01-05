import { ShipmentDetailView } from "@/app/modules/shipment/ui/views/shipment-detail-view";

interface ShipmentDetailPageProps {
  params: {
    id: string;
  };
}

export default function ShipmentDetailPage({ params }: ShipmentDetailPageProps) {
  const shipmentId = parseInt(params.id, 10);

  if (isNaN(shipmentId)) {
    return (
      <div className="p-6">
        <p className="text-destructive">Invalid shipment ID</p>
      </div>
    );
  }

  return <ShipmentDetailView shipmentId={shipmentId} />;
}

