import { Truck } from "../server/types/truck";

export const mockTrucks: Truck[] = [
  {
    id: "TRK-001",
    lat: 25.2048,
    lng: 55.2708,
    speed: 65,
    status: "moving",
    heading: 120,
  },
  {
    id: "TRK-002",
    lat: 25.2769,
    lng: 55.2962,
    speed: 0,
    status: "stopped",
    heading: 0,
  },
  {
    id: "TRK-003",
    lat: 25.185,
    lng: 55.255,
    speed: 40,
    status: "idle",
    heading: 270,
  },
];
