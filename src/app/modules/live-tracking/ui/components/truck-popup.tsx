import { Truck } from "../../server/types/truck";
import { Badge } from "@/components/ui/badge";

export function TruckPopup({ truck }: { truck: Truck }) {
  return (
    <div className="space-y-2 text-sm">
      <div className="font-semibold">🚛 {truck.id}</div>
      <Badge variant="secondary">{truck.status}</Badge>
      <div>Speed: {truck.speed} km/h</div>
      <div>
        {truck.lat.toFixed(4)}, {truck.lng.toFixed(4)}
      </div>
    </div>
  );
}
