"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Trash2,
  Edit,
  ArrowLeft,
  Loader2,
  MapPin,
  Calendar,
  Package,
  Building2,
  FileText,
  Mail,
  Phone,
  Truck,
  Navigation,
  Clock,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { useShipment } from "@/app/modules/shipment/server/hooks/use-shipment";
import { useDeleteShipment } from "@/app/modules/shipment/server/hooks/use-delete-shipment";
import { UpdateShipmentForm } from "@/app/modules/shipment/ui/components/update-shipment-form";
import { ContainerAssignTable } from "@/app/modules/shipment/ui/components/container-assign-table";
import { useContainerAssignColumns } from "@/app/modules/shipment/ui/components/container-assign-columns";
import { useAssignContainers } from "@/app/modules/shipment/server/hooks/use-assign-container";
import { useRemoveContainer } from "@/app/modules/shipment/server/hooks/use-remove-container";
import { useContainers } from "@/app/modules/container/server/hooks/use-containers";
import { useGetPrice } from "@/app/modules/shipment/server/hooks/use-get-price";
import { useRequestPrice } from "@/app/modules/shipment/server/hooks/use-request-price";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ShipmentDocumentsCard } from "../components/shipment-documents/shipment-documents-card";
import { DollarSign } from "lucide-react";

interface ShipmentDetailViewProps {
  shipmentId: number;
}

// Helper function to get status badge variant
const getStatusVariant = (status: string) => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes("completed") || statusLower.includes("delivered")) {
    return "success";
  }
  if (statusLower.includes("rejected")) {
    return "destructive";
  }
  if (statusLower.includes("accepted") || statusLower.includes("allocated")) {
    return "default";
  }
  if (statusLower.includes("in_transit") || statusLower.includes("ready")) {
    return "warning";
  }
  if (statusLower.includes("price_requested") || statusLower.includes("priced")) {
    return "default";
  }
  return "secondary";
};

// Helper function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export function ShipmentDetailView({ shipmentId }: ShipmentDetailViewProps) {
  const router = useRouter();
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedContainers, setSelectedContainers] = useState<number[]>([]);

  const { data: shipment, isLoading, error } = useShipment(shipmentId);
  const { mutate: deleteShipment, isPending: isDeleting } = useDeleteShipment();
  const { mutate: assignContainers } = useAssignContainers();
  const { mutate: removeContainer } = useRemoveContainer();
  const { mutate: getPrice } = useGetPrice();
  const { mutate: requestPrice, isPending: isRequestingPrice } = useRequestPrice();
  
  const handleRequestPrice = (shipmentId: number) => {
    requestPrice(shipmentId);
  };

  // Fetch containers assigned to this shipment
  const { data: containersData } = useContainers({ ship_id: shipmentId });
  const assignedContainers = containersData?.items || [];
  const assignedContainerIds = assignedContainers.map((c) => c.id);

  // Get columns with actions
  const columns = useContainerAssignColumns({
    activeShipmentId: shipmentId,
    assignedContainers: assignedContainerIds,
    onAssign: (containerId) => {
      assignContainers({ shipmentId, containerIds: [containerId] });
    },
    onRemove: (containerId) => {
      removeContainer({ shipmentId, containerId });
    },
    selectedContainers,
    onSelectionChange: setSelectedContainers,
    data: assignedContainers,
  });

  const handleGetPrice = (containerIds: number[]) => {
    if (containerIds.length === 0) return;
    getPrice({ shipmentId, containerIds });
  };

  const handleDelete = () => {
    deleteShipment(shipmentId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-destructive text-lg font-medium mb-2">
              Failed to load shipment details
            </p>
            <p className="text-muted-foreground mb-4">
              The shipment you're looking for doesn't exist or an error occurred.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/shipments")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shipments
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          onClick={() => router.push("/dashboard/shipments")}
          className="hover:text-foreground transition-colors"
        >
          Shipments
        </button>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Shipment #{shipment.id}</span>
      </div>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
        <div className="flex items-center gap-3 mb-1">
  <h1 className="text-3xl font-bold">Shipment #{shipment.id}</h1>

  <Badge
    variant={getStatusVariant(shipment.status ?? "created")}
    className="text-xs"
  >
    {(shipment.status ?? "created")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())}
  </Badge>
</div>

          <p className="text-sm text-muted-foreground">
            Created on {formatDate(shipment.pickup_date)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Request Price Button - Only show when status is "created" and has containers */}
          {shipment.status === "created" && assignedContainers.length > 0 && (
            <Button
              variant="default"
              onClick={() => requestPrice(shipmentId)}
              disabled={isRequestingPrice}
              className="shrink-0"
            >
              {isRequestingPrice ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Requesting...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Request Price
                </>
              )}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setIsEditMode(!isEditMode)}
            className="shrink-0"
          >
            <Edit className="h-4 w-4 mr-2" />
            {isEditMode ? "Cancel Edit" : "Edit Shipment"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            className="shrink-0"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Containers Assigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assignedContainers.length}</p>
                <p className="text-xs text-muted-foreground">Total containers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Route
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Navigation className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate capitalize">
                  {shipment.origin.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-muted-foreground">to</p>
                <p className="text-sm font-semibold truncate capitalize">
                  {shipment.destination.replace(/_/g, " ")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Delivery Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Calendar className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">{formatDate(shipment.delivery_date)}</p>
                <p className="text-xs text-muted-foreground">Scheduled delivery</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Update Form or Details View */}
      {isEditMode ? (
        <UpdateShipmentForm
          shipment={shipment}
          onSuccess={() => {
            setIsEditMode(false);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details - Takes 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Route Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Route Information
                </CardTitle>
                <CardDescription>Origin and destination details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Origin</span>
                    </div>
                    <p className="text-base font-medium capitalize">
                      {shipment.origin.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Destination</span>
                    </div>
                    <p className="text-base font-medium capitalize">
                      {shipment.destination.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Pickup Date</span>
                    </div>
                    <p className="text-base font-medium">{formatDate(shipment.pickup_date)}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Delivery Date</span>
                    </div>
                    <p className="text-base font-medium">{formatDate(shipment.delivery_date)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Facilities and Shipment Details - 3 columns side by side */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pickup Facility */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5" />
                    Pickup Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                <p className="text-sm font-medium mb-1">
  {shipment.pickup_facility?.name ?? "—"}
</p>

<p className="text-xs text-muted-foreground">
  {shipment.pickup_facility?.address ?? "—"}
</p>

<p className="text-xs text-muted-foreground">
  {shipment.pickup_facility?.region ?? "—"}, {shipment.pickup_facility?.country ?? "—"}
</p>

                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Contact Person</p>
                    <p className="text-sm font-medium">
  {shipment.pickup_facility?.contact_name ?? "—"}
</p>

<div className="flex items-center gap-2 text-xs text-muted-foreground">
  <Phone className="h-3 w-3" />
  <span>{shipment.pickup_facility?.contact_phone_number ?? "—"}</span>
</div>

<div className="flex items-center gap-2 text-xs text-muted-foreground">
  <Mail className="h-3 w-3" />
  <span>{shipment.pickup_facility?.contact_email ?? "—"}</span>
</div>

                  </div>
                </CardContent>
              </Card>

              {/* Delivery Facility */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle2 className="h-5 w-5" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                <div>
  <p className="text-sm font-medium mb-1">
    {shipment.delivery_facility?.name ?? "—"}
  </p>
  <p className="text-xs text-muted-foreground">
    {shipment.delivery_facility?.address ?? "—"}
  </p>
  <p className="text-xs text-muted-foreground">
    {shipment.delivery_facility?.region ?? "—"}, {shipment.delivery_facility?.country ?? "—"}
  </p>
</div>

                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Contact Person</p>
                    <div className="space-y-1">
  <p className="text-sm font-medium">
    {shipment.delivery_facility?.contact_name ?? "—"}
  </p>

  <div className="flex items-center gap-2 text-xs text-muted-foreground">
    <Phone className="h-3 w-3" />
    <span>{shipment.delivery_facility?.contact_phone_number ?? "—"}</span>
  </div>

  <div className="flex items-center gap-2 text-xs text-muted-foreground">
    <Mail className="h-3 w-3" />
    <span>{shipment.delivery_facility?.contact_email ?? "—"}</span>
  </div>
</div>

                  </div>
                </CardContent>
              </Card>

              {/* Shipment Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5" />
                    Shipment Details
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Documentation and reference numbers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Bill of Lading Number
                    </p>
                    <p className="text-sm font-mono">
                    <p className="text-sm font-mono">
  {shipment.shipment_details?.bill_of_lading_number ?? "N/A"}
</p>

                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Pickup Number</p>
                    <p className="text-sm font-mono">
  {shipment.shipment_details?.pickup_number ?? "N/A"}
</p>

                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Delivery Number</p>
                    <p className="text-sm font-mono">
  {shipment.shipment_details?.delivery_number ?? "N/A"}
</p>

                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Shipment Documents */}
            <ShipmentDocumentsCard shipId={shipment.id} />

          </div>

          {/* Sidebar - Takes 1/3 width */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Shipment ID</p>
                  <p className="text-sm font-mono font-semibold">#{shipment.id}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Shipper ID</p>
                  <p className="text-sm font-semibold">#{shipment.shipper_id}</p>
                </div>
                <Separator />
                <div>
  <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>

  {shipment.status ? (
    <Badge variant={getStatusVariant(shipment.status)} className="mt-1">
      {shipment.status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
    </Badge>
  ) : (
    <Badge variant="secondary" className="mt-1">
      N/A
    </Badge>
  )}
</div>

              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Container Assignment Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Container Assignment
          </CardTitle>
          <CardDescription>
            Manage containers assigned to this shipment. Search and assign containers or remove
            existing assignments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContainerAssignTable
            columns={columns}
            data={assignedContainers}
            activeShipmentId={shipmentId}
            onAssignContainer={(containerId) => {
              assignContainers({ shipmentId, containerIds: [containerId] });
            }}
            selectedContainers={selectedContainers}
            onSelectionChange={setSelectedContainers}
            onGetPrice={handleGetPrice}
            onRequestPrice={handleRequestPrice}
            shipmentStatus={shipment?.status}
            isRequestingPrice={isRequestingPrice}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Shipment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete shipment #{shipment.id}? This action cannot be
              undone.
              {assignedContainers.length > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  ⚠️ Warning: This shipment has {assignedContainers.length} assigned container(s).
                  They will be unassigned from this shipment.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Shipment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}