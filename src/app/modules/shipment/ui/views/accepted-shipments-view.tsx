"use client";

import { PricedShipItemsTable } from "../components/priced-ship-items-table";

export function AcceptedShipmentsView() {
  return (
    <div className="space-y-6">
      {/* Priced Shipments Information Table */}
      <PricedShipItemsTable />
    </div>
  );
}

