import { ShipmentDetailView } from "@/app/modules/shipment/ui/views/shipment-detail-view";

interface ShipmentDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ShipmentDetailPage({ params }: ShipmentDetailPageProps) {
  const { id } = await params;
  
  // Debug logging in development
  if (process.env.NODE_ENV === "development") {
    console.log("ShipmentDetailPage id:", id);
  }
  
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
        <p className="text-destructive">Invalid shipment ID: &quot;{id}&quot; is not a valid number</p>
      </div>
    );
  }

  return <ShipmentDetailView shipmentId={shipmentId} />;
}

