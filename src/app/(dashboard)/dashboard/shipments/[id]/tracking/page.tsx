import ShipmentTrackingClient from "./ShipmentTrackingClient";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
    return [{ id: "placeholder" }];
}

export default function ShipmentTrackingPage() {
    return <ShipmentTrackingClient />;
}
