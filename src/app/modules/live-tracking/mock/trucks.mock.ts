import { Truck } from "../server/types/truck";

export const mockTrucks: Truck[] = [
  {
    id: "TRK-001",
    // Addis Ababa, Ethiopia (Africa)
    lat: 9.1450,
    lng: 40.4897,
    speed: 55,
    status: "moving",
    heading: 90,
  },
  {
    id: "TRK-002",
    // Dubai, UAE (Middle East)
    lat: 25.2048,
    lng: 55.2708,
    speed: 0,
    status: "stopped",
    heading: 0,
  },
  {
    id: "TRK-003",
    // Mumbai, India (Asia)
    lat: 19.0760,
    lng: 72.8777,
    speed: 40,
    status: "idle",
    heading: 270,
  },
];
