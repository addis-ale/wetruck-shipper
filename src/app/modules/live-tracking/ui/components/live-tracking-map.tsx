"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-rotatedmarker";

import { Truck } from "../../server/types/truck";
import { Badge } from "@/components/ui/badge";

/* ---------------- Truck Icon ---------------- */

const truckIcon = new L.DivIcon({
  className: "",
  html: `
    <svg viewBox="0 0 24 24" width="32" height="32">
      <path
        d="M3 7h11v6h5l2 3v3h-2a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H3v-8z"
        fill="#dc2626"
      />
      <circle cx="7" cy="19" r="2" fill="#111827"/>
      <circle cx="17" cy="19" r="2" fill="#111827"/>
    </svg>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

/* ---------------- Component ---------------- */

export function LiveTrackingMap({ trucks }: { trucks: Truck[] }) {
  const center: LatLngExpression = trucks.length
    ? [trucks[0].lat, trucks[0].lng]
    : [25.2, 55.27];

  return (
    <MapContainer
      center={center}
      zoom={6}
      scrollWheelZoom={true}
      className="h-full w-full"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {trucks.map((truck) => (
        <Marker
          key={truck.id}
          position={[truck.lat, truck.lng]}
          icon={truckIcon}
          rotationAngle={truck.heading}
          rotationOrigin="center"
        >
          <Popup>
            <div className="space-y-2 text-sm">
              <div className="font-semibold">🚛 {truck.id}</div>
              <Badge variant="secondary">{truck.status}</Badge>
              <div>Speed: {truck.speed} km/h</div>
              <div>
                {truck.lat.toFixed(4)}, {truck.lng.toFixed(4)}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
