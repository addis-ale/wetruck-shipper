import { ShipmentQuotesDetailView } from "@/app/modules/shipment/ui/views/shipment-quotes-detail-view";

export default function ShipmentQuotesDetailPage({
  params,
}: {
  params: { shipId: string };
}) {
  return <ShipmentQuotesDetailView shipId={parseInt(params.shipId)} />;
}

