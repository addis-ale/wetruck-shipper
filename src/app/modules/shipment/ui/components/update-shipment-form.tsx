"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateShipmentSchema, UpdateShipmentInput } from "@/lib/zod/shipment.schema";
import { useUpdateShipment } from "@/app/modules/shipment/server/hooks/use-update-shipment";
import { ChevronDown, ChevronUp, Package } from "lucide-react";
import type { Shipment } from "@/app/modules/shipment/server/types/shipment.types";

type UpdateShipmentFormValues = z.input<typeof updateShipmentSchema>;

interface UpdateShipmentFormProps {
  shipment: Shipment;
  onSuccess?: () => void;
}

export function UpdateShipmentForm({ shipment, onSuccess }: UpdateShipmentFormProps) {
  const [pickupExpanded, setPickupExpanded] = useState(true);
  const [deliveryExpanded, setDeliveryExpanded] = useState(true);

  // Format date from ISO string to YYYY-MM-DD for date inputs
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const defaultValues = useMemo<UpdateShipmentInput>(
    () => ({
      origin: shipment.origin,
      destination: shipment.destination,
      pickup_date: formatDateForInput(shipment.pickup_date),
      delivery_date: formatDateForInput(shipment.delivery_date),
      pickup_facility: shipment.pickup_facility,
      delivery_facility: shipment.delivery_facility,
      shipment_details: shipment.shipment_details,
      status: shipment.status,
    }),
    [shipment]
  );

  const form = useForm<UpdateShipmentFormValues>({
    resolver: zodResolver(updateShipmentSchema),
    defaultValues,
    mode: "onChange",
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting, isValid },
  } = form;

  // Reset form when shipment changes
  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const { mutate, isPending } = useUpdateShipment(shipment.id, {
    onSuccess: () => {
      onSuccess?.();
    },
  });

  const submitting = isPending || isSubmitting;

  function onSubmit(values: UpdateShipmentFormValues) {
    const parsed = updateShipmentSchema.parse(values);
    mutate(parsed);
  }

  const originDestinationEnum = z.enum([
    "addis_ababa",
    "adama",
    "dukem",
    "debre_zeit",
    "hawassa",
    "shashemene",
    "djibouti_port",
  ]);

  const formatLocation = (location: string) => {
    return location
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Update Shipment</CardTitle>
        <CardDescription>Update shipment details and information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Origin and Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origin">Origin *</Label>
              <Controller
                name="origin"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="origin" className="w-full">
                      <SelectValue placeholder="Select origin" />
                    </SelectTrigger>
                    <SelectContent>
                      {originDestinationEnum.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {formatLocation(option)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.origin && (
                <p className="text-sm text-destructive">{errors.origin.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">Destination *</Label>
              <Controller
                name="destination"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="destination" className="w-full">
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {originDestinationEnum.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {formatLocation(option)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.destination && (
                <p className="text-sm text-destructive">{errors.destination.message}</p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pickup_date">Pickup Date *</Label>
              <Input
                id="pickup_date"
                type="date"
                {...register("pickup_date")}
              />
              {errors.pickup_date && (
                <p className="text-sm text-destructive">{errors.pickup_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_date">Delivery Date *</Label>
              <Input
                id="delivery_date"
                type="date"
                {...register("delivery_date")}
              />
              {errors.delivery_date && (
                <p className="text-sm text-destructive">{errors.delivery_date.message}</p>
              )}
            </div>
          </div>

          {/* Pickup Facility */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setPickupExpanded(!pickupExpanded)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="font-medium">Pickup Facility</span>
              </div>
              {pickupExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {pickupExpanded && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2">
                <div className="space-y-2">
                  <Label htmlFor="pickup_facility.country">Country *</Label>
                  <Input
                    id="pickup_facility.country"
                    {...register("pickup_facility.country")}
                  />
                  {errors.pickup_facility?.country && (
                    <p className="text-sm text-destructive">
                      {errors.pickup_facility.country.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickup_facility.region">Region *</Label>
                  <Input
                    id="pickup_facility.region"
                    {...register("pickup_facility.region")}
                  />
                  {errors.pickup_facility?.region && (
                    <p className="text-sm text-destructive">
                      {errors.pickup_facility.region.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="pickup_facility.name">Facility Name *</Label>
                  <Input
                    id="pickup_facility.name"
                    {...register("pickup_facility.name")}
                  />
                  {errors.pickup_facility?.name && (
                    <p className="text-sm text-destructive">
                      {errors.pickup_facility.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="pickup_facility.address">Address *</Label>
                  <Input
                    id="pickup_facility.address"
                    {...register("pickup_facility.address")}
                  />
                  {errors.pickup_facility?.address && (
                    <p className="text-sm text-destructive">
                      {errors.pickup_facility.address.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickup_facility.contact_name">Contact Name *</Label>
                  <Input
                    id="pickup_facility.contact_name"
                    {...register("pickup_facility.contact_name")}
                  />
                  {errors.pickup_facility?.contact_name && (
                    <p className="text-sm text-destructive">
                      {errors.pickup_facility.contact_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickup_facility.contact_phone_number">
                    Contact Phone *
                  </Label>
                  <Input
                    id="pickup_facility.contact_phone_number"
                    {...register("pickup_facility.contact_phone_number")}
                  />
                  {errors.pickup_facility?.contact_phone_number && (
                    <p className="text-sm text-destructive">
                      {errors.pickup_facility.contact_phone_number.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="pickup_facility.contact_email">Contact Email *</Label>
                  <Input
                    id="pickup_facility.contact_email"
                    type="email"
                    {...register("pickup_facility.contact_email")}
                  />
                  {errors.pickup_facility?.contact_email && (
                    <p className="text-sm text-destructive">
                      {errors.pickup_facility.contact_email.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Delivery Facility */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setDeliveryExpanded(!deliveryExpanded)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="font-medium">Delivery Facility</span>
              </div>
              {deliveryExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {deliveryExpanded && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2">
                <div className="space-y-2">
                  <Label htmlFor="delivery_facility.country">Country *</Label>
                  <Input
                    id="delivery_facility.country"
                    {...register("delivery_facility.country")}
                  />
                  {errors.delivery_facility?.country && (
                    <p className="text-sm text-destructive">
                      {errors.delivery_facility.country.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_facility.region">Region *</Label>
                  <Input
                    id="delivery_facility.region"
                    {...register("delivery_facility.region")}
                  />
                  {errors.delivery_facility?.region && (
                    <p className="text-sm text-destructive">
                      {errors.delivery_facility.region.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="delivery_facility.name">Facility Name *</Label>
                  <Input
                    id="delivery_facility.name"
                    {...register("delivery_facility.name")}
                  />
                  {errors.delivery_facility?.name && (
                    <p className="text-sm text-destructive">
                      {errors.delivery_facility.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="delivery_facility.address">Address *</Label>
                  <Input
                    id="delivery_facility.address"
                    {...register("delivery_facility.address")}
                  />
                  {errors.delivery_facility?.address && (
                    <p className="text-sm text-destructive">
                      {errors.delivery_facility.address.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_facility.contact_name">Contact Name *</Label>
                  <Input
                    id="delivery_facility.contact_name"
                    {...register("delivery_facility.contact_name")}
                  />
                  {errors.delivery_facility?.contact_name && (
                    <p className="text-sm text-destructive">
                      {errors.delivery_facility.contact_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_facility.contact_phone_number">
                    Contact Phone *
                  </Label>
                  <Input
                    id="delivery_facility.contact_phone_number"
                    {...register("delivery_facility.contact_phone_number")}
                  />
                  {errors.delivery_facility?.contact_phone_number && (
                    <p className="text-sm text-destructive">
                      {errors.delivery_facility.contact_phone_number.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="delivery_facility.contact_email">Contact Email *</Label>
                  <Input
                    id="delivery_facility.contact_email"
                    type="email"
                    {...register("delivery_facility.contact_email")}
                  />
                  {errors.delivery_facility?.contact_email && (
                    <p className="text-sm text-destructive">
                      {errors.delivery_facility.contact_email.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Shipment Details */}
          <div className="space-y-4">
            <h3 className="font-medium">Shipment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shipment_details.bill_of_lading_number">
                  Bill of Lading Number
                </Label>
                <Input
                  id="shipment_details.bill_of_lading_number"
                  {...register("shipment_details.bill_of_lading_number")}
                />
                {errors.shipment_details?.bill_of_lading_number && (
                  <p className="text-sm text-destructive">
                    {errors.shipment_details.bill_of_lading_number.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="shipment_details.pickup_number">Pickup Number</Label>
                <Input
                  id="shipment_details.pickup_number"
                  {...register("shipment_details.pickup_number")}
                />
                {errors.shipment_details?.pickup_number && (
                  <p className="text-sm text-destructive">
                    {errors.shipment_details.pickup_number.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="shipment_details.delivery_number">Delivery Number</Label>
                <Input
                  id="shipment_details.delivery_number"
                  {...register("shipment_details.delivery_number")}
                />
                {errors.shipment_details?.delivery_number && (
                  <p className="text-sm text-destructive">
                    {errors.shipment_details.delivery_number.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => reset(defaultValues)}>
              Reset
            </Button>
            <Button type="submit" disabled={submitting || !isValid}>
              {submitting ? "Updating..." : "Update Shipment"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

