"use client";

import { useMemo, useState } from "react";
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
import { createShipmentSchema, CreateShipmentInput } from "@/lib/zod/shipment.schema";
import { useCreateShipment } from "@/app/modules/shipment/server/hooks/use-create-shipment";
import { ChevronDown, ChevronUp, Package } from "lucide-react";

type CreateShipmentFormValues = z.input<typeof createShipmentSchema>;

interface CreateShipmentFormProps {
  onSuccess?: (shipmentId: string) => void;
}

export function CreateShipmentForm({ onSuccess }: CreateShipmentFormProps) {
  const [pickupExpanded, setPickupExpanded] = useState(true);
  const [deliveryExpanded, setDeliveryExpanded] = useState(true);

  const defaultValues = useMemo<CreateShipmentInput>(
    () => ({
      origin: "addis_ababa",
      destination: "addis_ababa",
      pickup_date: "",
      delivery_date: "",
      pickup_facility: {
        country: "",
        region: "",
        name: "",
        address: "",
        contact_name: "",
        contact_phone_number: "",
        contact_email: "",
      },
      delivery_facility: {
        country: "",
        region: "",
        name: "",
        address: "",
        contact_name: "",
        contact_phone_number: "",
        contact_email: "",
      },
      shipment_details: {
        bill_of_lading_number: "",
        pickup_number: "",
        delivery_number: "",
      },
      status: "created",
    }),
    []
  );

  const form = useForm<CreateShipmentFormValues>({
    resolver: zodResolver(createShipmentSchema),
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

  const { mutate, isPending } = useCreateShipment({
    onSuccess: (shipmentId) => {
      reset(defaultValues);
      onSuccess?.(shipmentId.toString());
    },
  });

  const submitting = isPending || isSubmitting;

  function onSubmit(values: CreateShipmentFormValues) {
    const parsed = createShipmentSchema.parse(values);
    mutate(parsed);
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <CardTitle>Create New Shipment</CardTitle>
        </div>
        <CardDescription>
          Fill in the shipment details to create a new shipment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="origin">Origin</Label>
              <Controller
                name="origin"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="origin" className="w-full">
                      <SelectValue placeholder="Select origin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="addis_ababa">Addis Ababa</SelectItem>
                      <SelectItem value="adama">Adama</SelectItem>
                      <SelectItem value="dukem">Dukem</SelectItem>
                      <SelectItem value="debre_zeit">Debre Zeit</SelectItem>
                      <SelectItem value="hawassa">Hawassa</SelectItem>
                      <SelectItem value="shashemene">Shashemene</SelectItem>
                      <SelectItem value="djibouti_port">Djibouti Port</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.origin && (
                <p className="text-sm text-destructive">{errors.origin.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Controller
                name="destination"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="destination" className="w-full">
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="addis_ababa">Addis Ababa</SelectItem>
                      <SelectItem value="adama">Adama</SelectItem>
                      <SelectItem value="dukem">Dukem</SelectItem>
                      <SelectItem value="debre_zeit">Debre Zeit</SelectItem>
                      <SelectItem value="hawassa">Hawassa</SelectItem>
                      <SelectItem value="shashemene">Shashemene</SelectItem>
                      <SelectItem value="djibouti_port">Djibouti Port</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.destination && (
                <p className="text-sm text-destructive">{errors.destination.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickup_date">Pickup Date</Label>
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
              <Label htmlFor="delivery_date">Delivery Date</Label>
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

          <Separator />

          {/* Shipment Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Shipment Details</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="bill_of_lading_number">Bill of Lading Number</Label>
                <Input
                  id="bill_of_lading_number"
                  {...register("shipment_details.bill_of_lading_number")}
                />
                {errors.shipment_details?.bill_of_lading_number && (
                  <p className="text-sm text-destructive">
                    {errors.shipment_details.bill_of_lading_number.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickup_number">Pickup Number</Label>
                <Input id="pickup_number" {...register("shipment_details.pickup_number")} />
                {errors.shipment_details?.pickup_number && (
                  <p className="text-sm text-destructive">
                    {errors.shipment_details.pickup_number.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_number">Delivery Number</Label>
                <Input
                  id="delivery_number"
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

          <Separator />

          {/* Pickup Facility */}
          <div className="rounded-md border">
            <button
              type="button"
              onClick={() => setPickupExpanded(!pickupExpanded)}
              className="flex w-full items-center justify-between p-4 text-left font-medium hover:bg-accent/50 transition-colors"
            >
              <span>Pickup Facility</span>
              {pickupExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {pickupExpanded && (
              <div className="p-4 pt-0 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pickup_country">Country</Label>
                    <Input id="pickup_country" {...register("pickup_facility.country")} />
                    {errors.pickup_facility?.country && (
                      <p className="text-sm text-destructive">
                        {errors.pickup_facility.country.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pickup_region">Region</Label>
                    <Input id="pickup_region" {...register("pickup_facility.region")} />
                    {errors.pickup_facility?.region && (
                      <p className="text-sm text-destructive">
                        {errors.pickup_facility.region.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pickup_name">Facility Name</Label>
                    <Input id="pickup_name" {...register("pickup_facility.name")} />
                    {errors.pickup_facility?.name && (
                      <p className="text-sm text-destructive">
                        {errors.pickup_facility.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pickup_address">Address</Label>
                    <Input id="pickup_address" {...register("pickup_facility.address")} />
                    {errors.pickup_facility?.address && (
                      <p className="text-sm text-destructive">
                        {errors.pickup_facility.address.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pickup_contact_name">Contact Name</Label>
                    <Input
                      id="pickup_contact_name"
                      {...register("pickup_facility.contact_name")}
                    />
                    {errors.pickup_facility?.contact_name && (
                      <p className="text-sm text-destructive">
                        {errors.pickup_facility.contact_name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pickup_contact_phone">Contact Phone</Label>
                    <Input
                      id="pickup_contact_phone"
                      {...register("pickup_facility.contact_phone_number")}
                    />
                    {errors.pickup_facility?.contact_phone_number && (
                      <p className="text-sm text-destructive">
                        {errors.pickup_facility.contact_phone_number.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="pickup_contact_email">Contact Email</Label>
                    <Input
                      id="pickup_contact_email"
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
              </div>
            )}
          </div>

          {/* Delivery Facility */}
          <div className="rounded-md border">
            <button
              type="button"
              onClick={() => setDeliveryExpanded(!deliveryExpanded)}
              className="flex w-full items-center justify-between p-4 text-left font-medium hover:bg-accent/50 transition-colors"
            >
              <span>Delivery Facility</span>
              {deliveryExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {deliveryExpanded && (
              <div className="p-4 pt-0 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="delivery_country">Country</Label>
                    <Input
                      id="delivery_country"
                      {...register("delivery_facility.country")}
                    />
                    {errors.delivery_facility?.country && (
                      <p className="text-sm text-destructive">
                        {errors.delivery_facility.country.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery_region">Region</Label>
                    <Input id="delivery_region" {...register("delivery_facility.region")} />
                    {errors.delivery_facility?.region && (
                      <p className="text-sm text-destructive">
                        {errors.delivery_facility.region.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery_name">Facility Name</Label>
                    <Input id="delivery_name" {...register("delivery_facility.name")} />
                    {errors.delivery_facility?.name && (
                      <p className="text-sm text-destructive">
                        {errors.delivery_facility.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery_address">Address</Label>
                    <Input
                      id="delivery_address"
                      {...register("delivery_facility.address")}
                    />
                    {errors.delivery_facility?.address && (
                      <p className="text-sm text-destructive">
                        {errors.delivery_facility.address.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery_contact_name">Contact Name</Label>
                    <Input
                      id="delivery_contact_name"
                      {...register("delivery_facility.contact_name")}
                    />
                    {errors.delivery_facility?.contact_name && (
                      <p className="text-sm text-destructive">
                        {errors.delivery_facility.contact_name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery_contact_phone">Contact Phone</Label>
                    <Input
                      id="delivery_contact_phone"
                      {...register("delivery_facility.contact_phone_number")}
                    />
                    {errors.delivery_facility?.contact_phone_number && (
                      <p className="text-sm text-destructive">
                        {errors.delivery_facility.contact_phone_number.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="delivery_contact_email">Contact Email</Label>
                    <Input
                      id="delivery_contact_email"
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
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => reset(defaultValues)}
              disabled={submitting}
            >
              Reset
            </Button>
            <Button type="submit" disabled={submitting || !isValid}>
              {submitting ? "Creating..." : "Create Shipment"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

