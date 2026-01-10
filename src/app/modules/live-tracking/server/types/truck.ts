export type TruckStatus = "moving" | "stopped" | "idle";

export interface Truck {
  id: string;
  lat: number;
  lng: number;
  speed: number;
  status: TruckStatus;
  heading: number;
}
