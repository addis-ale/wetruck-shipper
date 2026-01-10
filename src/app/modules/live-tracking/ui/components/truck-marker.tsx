import maplibregl from "maplibre-gl";
import { Truck } from "../../server/types/truck";
import { createRoot } from "react-dom/client";
import { TruckPopup } from "./truck-popup";

export function createTruckMarker(
  map: maplibregl.Map,
  truck: Truck
): maplibregl.Marker {
  const el = document.createElement("div");

  el.className = "w-8 h-8";
  el.style.transform = `rotate(${truck.heading}deg)`;
  el.style.transformOrigin = "center";

  el.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" class="w-full h-full">
      <path
        d="M3 7h11v6h5l2 3v3h-2a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H3v-8z"
        fill="#dc2626"
      />
      <circle cx="7" cy="19" r="2" fill="#111827"/>
      <circle cx="17" cy="19" r="2" fill="#111827"/>
    </svg>
  `;

  const popupNode = document.createElement("div");
  createRoot(popupNode).render(<TruckPopup truck={truck} />);

  const popup = new maplibregl.Popup({ offset: 25 }).setDOMContent(popupNode);

  return new maplibregl.Marker(el)
    .setLngLat([truck.lng, truck.lat])
    .setPopup(popup)
    .addTo(map);
}
