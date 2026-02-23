import ShipmentDetailClient from "./ShipmentDetailClient";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function ShipmentDetailPage() {
  return <ShipmentDetailClient />;
}
