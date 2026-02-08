import { ShipmentQuotesDetailView } from "@/app/modules/shipment/ui/views/shipment-quotes-detail-view";

export default async function ShipmentQuotesDetailPage({
  params,
}: {
  params: Promise<{ shipId: string }>;
}) {
  const { shipId } = await params;
  const id = parseInt(shipId, 10);
  if (isNaN(id)) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Invalid shipment ID
      </div>
    );
  }
  return <ShipmentQuotesDetailView shipId={id} />;
}
