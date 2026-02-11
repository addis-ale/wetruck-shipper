"use client";

import Link from "next/link";
import type { Shipment } from "@/app/modules/shipment/server/types/shipment.types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package2, MapPin, Calendar, Edit, ExternalLink } from "lucide-react";

interface ShipmentSidebarProps {
  shipments: Shipment[];
  activeShipmentId: number | null;
  onSelectShipment: (shipmentId: number) => void;
  onEditShipment?: (shipmentId: number) => void;
  containerCounts?: Map<number, number>;
}

export function ShipmentSidebar({
  shipments,
  activeShipmentId,
  onSelectShipment,
  onEditShipment,
  containerCounts,
}: ShipmentSidebarProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "created":
        return "secondary";
      case "in_transit":
        return "default";
      case "delivered":
        return "outline";
      case "cancelled":
        return "destructive";
      case "priced":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const formatLocation = (location: string) => {
    return location
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Package2 className="h-5 w-5" />
          Shipments
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div className="h-[calc(100vh-250px)] overflow-y-auto scrollbar-hide">
          <div className="space-y-2 p-4 pt-0">
            {shipments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No shipments yet. Create one to get started.
              </div>
            ) : (
              shipments.map((shipment) => {
                const isActive = activeShipmentId === shipment.id;
                const containerCount = containerCounts?.get(shipment.id) || 0;
                return (
                  <div
                    key={shipment.id}
                    className={cn(
                      "rounded-lg border p-3 transition-all hover:shadow-md",
                      isActive
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <div
                      onClick={() => onSelectShipment(shipment.id)}
                      className="cursor-pointer"
                    >
                      <div className="space-y-2">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={getStatusColor(
                                  shipment.status ?? "created",
                                )}
                              >
                                {shipment.status ?? "created"}
                              </Badge>

                              {containerCount > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {containerCount} container
                                  {containerCount !== 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          </div>
                          {onEditShipment && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditShipment(shipment.id);
                              }}
                              className="h-7 w-7 p-0 hover:bg-primary/10"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </div>

                        {/* Route */}
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate font-medium">
                            {formatLocation(shipment.origin)}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="truncate font-medium">
                            {formatLocation(shipment.destination)}
                          </span>
                        </div>

                        {/* Dates */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span>
                            {formatDate(shipment.pickup_date)} -{" "}
                            {formatDate(shipment.delivery_date)}
                          </span>
                        </div>

                        {/* BOL Number */}
                        <div className="text-xs text-muted-foreground truncate">
                          BOL:{" "}
                          {shipment.shipment_details?.bill_of_lading_number ??
                            "N/A"}
                        </div>
                      </div>
                    </div>
                    {/* View Details Link */}
                    <div className="mt-2 pt-2 border-t">
                      <Link
                        href={`/dashboard/shipments/${shipment.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Details
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
