"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { Truck } from "../../server/types/truck";
import { createTruckMarker } from "./truck-marker";

export function LiveTrackingMap({ trucks }: { trucks: Truck[] }) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Record<string, maplibregl.Marker>>({});
  const hasFitBoundsRef = useRef(false);

  // Init map
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: "live-tracking-map",
      style: "https://demotiles.maplibre.org/style.json",
      center: [55.27, 25.2],
      zoom: 6,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl());
  }, []);

  // Update markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || trucks.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();

    trucks.forEach((truck) => {
      bounds.extend([truck.lng, truck.lat]);

      const existing = markersRef.current[truck.id];

      if (existing) {
        existing.setLngLat([truck.lng, truck.lat]);
        existing.getElement().style.transform = `rotate(${truck.heading}deg)`;
      } else {
        markersRef.current[truck.id] = createTruckMarker(map, truck);
      }
    });

 
    if (!hasFitBoundsRef.current) {
      map.fitBounds(bounds, {
        padding: 120,
        maxZoom: 14,
        duration: 800,
      });

      hasFitBoundsRef.current = true;
    }
  }, [trucks]);

  return (
    <div
      id="live-tracking-map"
      className="h-full w-full rounded-lg overflow-hidden"
    />
  );
}
