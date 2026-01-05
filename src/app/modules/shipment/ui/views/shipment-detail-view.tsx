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
import { Trash2, Edit, ArrowLeft, Loader2 } from "lucide-react";
import { useShipment } from "@/app/modules/shipment/server/hooks/use-shipment";
import { useDeleteShipment } from "@/app/modules/shipment/server/hooks/use-delete-shipment";
import { UpdateShipmentForm } from "@/app/modules/shipment/ui/components/update-shipment-form";
import { ContainerAssignTable } from "@/app/modules/shipment/ui/components/container-assign-table";
import { useContainerAssignColumns } from "@/app/modules/shipment/ui/components/container-assign-columns";
import { useAssignContainers } from "@/app/modules/shipment/server/hooks/use-assign-container";
import { useRemoveContainer } from "@/app/modules/shipment/server/hooks/use-remove-container";
import { useContainers } from "@/app/modules/container/server/hooks/use-containers";
import { useGetPrice } from "@/app/modules/shipment/server/hooks/use-get-price";
import { Skeleton } from "@/components/ui/skeleton";

interface ShipmentDetailViewProps {
  shipmentId: number;
}

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
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-destructive">Failed to load shipment details</p>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/shipments")}
              className="mt-4"
            >
              Back to Shipments
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/shipments")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Shipment Details</h1>
            <p className="text-sm text-muted-foreground">
              ID: {shipment.id} • Status: {shipment.status}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditMode(!isEditMode)}
          >
            <Edit className="h-4 w-4 mr-2" />
            {isEditMode ? "Cancel Edit" : "Edit"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
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
        <Card>
          <CardHeader>
            <CardTitle>Shipment Information</CardTitle>
            <CardDescription>View shipment details and information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Origin</p>
                <p className="text-base">{shipment.origin}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Destination</p>
                <p className="text-base">{shipment.destination}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pickup Date</p>
                <p className="text-base">
                  {new Date(shipment.pickup_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Delivery Date</p>
                <p className="text-base">
                  {new Date(shipment.delivery_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-base capitalize">{shipment.status}</p>
              </div>
            </div>

            {/* Pickup Facility */}
            <div>
              <h3 className="font-medium mb-2">Pickup Facility</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p>{shipment.pickup_facility.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Country</p>
                  <p>{shipment.pickup_facility.country}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Region</p>
                  <p>{shipment.pickup_facility.region}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p>{shipment.pickup_facility.address}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact</p>
                  <p>{shipment.pickup_facility.contact_name}</p>
                  <p className="text-sm">{shipment.pickup_facility.contact_phone_number}</p>
                  <p className="text-sm">{shipment.pickup_facility.contact_email}</p>
                </div>
              </div>
            </div>

            {/* Delivery Facility */}
            <div>
              <h3 className="font-medium mb-2">Delivery Facility</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p>{shipment.delivery_facility.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Country</p>
                  <p>{shipment.delivery_facility.country}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Region</p>
                  <p>{shipment.delivery_facility.region}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p>{shipment.delivery_facility.address}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact</p>
                  <p>{shipment.delivery_facility.contact_name}</p>
                  <p className="text-sm">{shipment.delivery_facility.contact_phone_number}</p>
                  <p className="text-sm">{shipment.delivery_facility.contact_email}</p>
                </div>
              </div>
            </div>

            {/* Shipment Details */}
            <div>
              <h3 className="font-medium mb-2">Shipment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-4 border-l-2">
                <div>
                  <p className="text-sm text-muted-foreground">Bill of Lading Number</p>
                  <p>{shipment.shipment_details.bill_of_lading_number || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pickup Number</p>
                  <p>{shipment.shipment_details.pickup_number || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Delivery Number</p>
                  <p>{shipment.shipment_details.delivery_number || "N/A"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Container Assignment */}
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
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Shipment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this shipment? This action cannot be undone.
              {assignedContainers.length > 0 && (
                <span className="block mt-2 text-destructive">
                  Warning: This shipment has {assignedContainers.length} assigned container(s).
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
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

