"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-rotatedmarker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------- Types ---------------- */

interface LocationLog {
    latitude?: number;
    longitude?: number;
    timestamp?: string;
    speed?: number;
    direction?: number;
}

interface TrackingItem {
    truck_id: number;
    ship_item: {
        transporter_name: string | null;
        status: string;
    };
    location_log: LocationLog[];
}

interface ShipmentTrackingMapProps {
    items: TrackingItem[];
}

/* ---------------- Helpers ---------------- */

const COLORS = [
    "#2563eb", // blue-600
    "#dc2626", // red-600
    "#16a34a", // green-600
    "#9333ea", // purple-600
    "#ea580c", // orange-600
    "#0891b2", // cyan-600
    "#4f46e5", // indigo-600
];

const getTruckIcon = (color: string) => new L.DivIcon({
    className: "truck-marker-icon",
    html: `
    <div style="transform: rotate(0deg); transition: transform 0.3s ease-in-out;">
      <svg viewBox="0 0 24 24" width="40" height="40" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
        <!-- Truck Body -->
        <path
          d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
          fill="${color}"
        />
        <!-- Windows/Details -->
        <path d="M17 9.5h2.5l-1.96-2.5H17v2.5z" fill="white" opacity="0.3" />
      </svg>
    </div>
  `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

const getPointIcon = (color: string) => new L.DivIcon({
    className: "point-marker-icon",
    html: `<div style="width: 8px; height: 8px; background-color: ${color}; border: 1.5px solid white; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>`,
    iconSize: [8, 8],
    iconAnchor: [4, 4],
});

const getOriginIcon = () => new L.DivIcon({
    className: "origin-marker-icon",
    html: `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
      <div style="background-color: #10b981; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>
      <div style="position: absolute; top: 18px; background-color: white; color: #10b981; font-size: 11px; font-weight: 800; padding: 2px 6px; border-radius: 4px; border: 1.5px solid #10b981; text-transform: uppercase; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.15); letter-spacing: 0.5px;">
        start
      </div>
    </div>
  `,
    iconSize: [24, 48],
    iconAnchor: [12, 7],
});

/* ---------------- Component ---------------- */

export function ShipmentTrackingMap({ items }: ShipmentTrackingMapProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Toggle fullscreen
    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    // Handle Escape key to exit fullscreen
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [isFullscreen]);

    // Filter out items without valid coordinates
    const validItems = items.filter(item =>
        item.location_log.some(log => log.latitude !== undefined && log.longitude !== undefined)
    );

    const center: [number, number] = validItems.length > 0 && validItems[0].location_log.length > 0
        ? [
            validItems[0].location_log[validItems[0].location_log.length - 1].latitude!,
            validItems[0].location_log[validItems[0].location_log.length - 1].longitude!
        ]
        : [9.145, 40.4896];

    return (
        <div className={cn(
            "relative w-full rounded-xl overflow-hidden border border-border shadow-sm transition-all duration-300",
            isFullscreen ? "fixed inset-0 z-[9999] rounded-none h-screen bg-background" : "h-full"
        )}>
            {/* Fullscreen Toggle Button */}
            <div className="absolute top-4 right-4 z-[1000]">
                <Button
                    variant="secondary"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="bg-white/90 hover:bg-white shadow-md border-border backdrop-blur-sm"
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                    {isFullscreen ? (
                        <Minimize2 className="h-5 w-5 text-primary" />
                    ) : (
                        <Maximize2 className="h-5 w-5 text-primary" />
                    )}
                </Button>
            </div>

            <MapContainer
                center={center}
                zoom={6}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {validItems.map((item, index) => {
                    const color = COLORS[index % COLORS.length];
                    const fullPath = item.location_log
                        .filter(log => log.latitude !== undefined && log.longitude !== undefined);

                    const pathCoordinates = fullPath.map(log => [log.latitude!, log.longitude!] as [number, number]);

                    const latestLog = fullPath[fullPath.length - 1];
                    const firstLog = fullPath[0];
                    const hasLatest = !!latestLog;

                    return (
                        <div key={item.truck_id}>
                            {/* Trajectory Polyline */}
                            {pathCoordinates.length > 1 && (
                                <Polyline
                                    positions={pathCoordinates}
                                    color={color}
                                    weight={4}
                                    opacity={0.6}
                                    lineJoin="round"
                                    lineCap="round"
                                />
                            )}

                            {/* Start Point Marker (Origin) */}
                            {firstLog && (
                                <Marker
                                    position={[firstLog.latitude!, firstLog.longitude!]}
                                    icon={getOriginIcon()}
                                >
                                    <Popup>
                                        <div className="p-1 font-semibold text-xs text-emerald-600">
                                            START POINT: Truck #{item.truck_id}
                                        </div>
                                    </Popup>
                                </Marker>
                            )}


                            {/* Current Position Marker (Illustration) */}
                            {hasLatest && (
                                <Marker
                                    position={[latestLog.latitude!, latestLog.longitude!]}
                                    icon={getTruckIcon(color)}
                                    // @ts-ignore
                                    rotationAngle={latestLog.direction || 0}
                                    rotationOrigin="center"
                                >
                                    <Popup>
                                        <div className="space-y-2 text-sm p-1">
                                            <div className="font-bold flex items-center gap-2">
                                                <span
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: color }}
                                                />
                                                Truck #{item.truck_id}
                                            </div>
                                            <Badge variant="secondary" className="capitalize">
                                                {item.ship_item.status.replace(/_/g, " ")}
                                            </Badge>
                                            {item.ship_item.transporter_name && (
                                                <div className="text-xs text-muted-foreground">
                                                    {item.ship_item.transporter_name}
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 border-t mt-2">
                                                <span className="text-muted-foreground italic">Speed:</span>
                                                <span className="font-bold">{(latestLog.speed || 0) / 1000} km/h</span>
                                                <span className="text-muted-foreground italic">Lat:</span>
                                                <span className="font-mono">{latestLog.latitude?.toFixed(4)}</span>
                                                <span className="text-muted-foreground italic">Lng:</span>
                                                <span className="font-mono">{latestLog.longitude?.toFixed(4)}</span>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            )}
                        </div>
                    );
                })}
            </MapContainer>
        </div>
    );
}
