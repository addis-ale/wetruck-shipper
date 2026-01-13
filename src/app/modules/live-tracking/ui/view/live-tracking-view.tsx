"use client";

import { useEffect, useState } from "react";
import { mockTrucks } from "../../mock/trucks.mock";
import { Truck } from "../../server/types/truck";
import { LiveTrackingMap } from "../components/live-tracking-map";

export function LiveTrackingView() {
  const [trucks, setTrucks] = useState<Truck[]>(mockTrucks);

  // Simulate live movement
  useEffect(() => {
    const interval = setInterval(() => {
      setTrucks((prev) =>
        prev.map((t) =>
          t.status === "moving"
            ? {
                ...t,
                lat: t.lat + Math.random() * 0.0002,
                lng: t.lng + Math.random() * 0.0002,
                heading: (t.heading + 10) % 360,
              }
            : t
        )
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-[calc(100vh-120px)] w-full">
      {/* Header */}
      <div className="mb-3">
        <h1 className="text-xl font-semibold">Live Tracking</h1>
        <p className="text-sm text-muted-foreground">
          Real-time truck locations (mock data)
        </p>
      </div>

      {/* Full map */}
      <div className="h-full w-full rounded-lg border overflow-hidden">
        <LiveTrackingMap trucks={trucks} />
      </div>
    </div>
  );
}
