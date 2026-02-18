import ShipmentQuotesDetailClient from "./ShipmentQuotesDetailClient";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ shipId: "placeholder" }];
}

export default function ShipmentQuotesDetailPage() {
  return <ShipmentQuotesDetailClient />;
}
