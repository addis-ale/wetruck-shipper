"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useShipItems } from "@/app/modules/shipment/server/hooks/use-transporter-shipments";
import type { ShipItem } from "@/lib/zod/shipment.schema";

interface PricedShipItemsTableProps {
  activeShipmentId: number | null;
}

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
};

export function PricedShipItemsTable({ activeShipmentId }: PricedShipItemsTableProps) {
  const { data, isLoading, error } = useShipItems(
    activeShipmentId ? { ship_id: activeShipmentId } : undefined
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Priced Ship Items</CardTitle>
          <CardDescription>
            Ship items with pricing information from transporters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Priced Ship Items</CardTitle>
          <CardDescription>
            Ship items with pricing information from transporters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Error loading priced ship items: {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const shipItems = data?.items || [];

  if (!activeShipmentId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Priced Ship Items</CardTitle>
          <CardDescription>
            Ship items with pricing information from transporters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select a shipment to view priced ship items.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (shipItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Priced Ship Items</CardTitle>
          <CardDescription>
            Ship items with pricing information from transporters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No priced ship items available for this shipment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Priced Ship Items</CardTitle>
        <CardDescription>
          Ship items with pricing information from transporters ({shipItems.length} item{shipItems.length !== 1 ? "s" : ""})
          {activeShipmentId && ` for Ship #${activeShipmentId}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Containers</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Transporter ID</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipItems.map((item: ShipItem) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    #{item.id}
                  </TableCell>
                  <TableCell>
                    {Array.isArray(item.containers) && item.containers.length > 0
                      ? item.containers.length === 1
                        ? String(item.containers[0])
                        : `${item.containers.length} containers`
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {item.computed_price !== undefined && item.computed_price !== null
                      ? item.computed_price.toLocaleString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>{item.currency || "ETB"}</TableCell>
                  <TableCell>{item.transporter_id || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.status || "N/A"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

