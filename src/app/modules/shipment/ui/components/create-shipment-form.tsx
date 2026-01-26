"use client";

import { useMemo, useEffect } from "react";
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
import { Combobox } from "@/components/ui/combobox";
import { createShipmentSchema, CreateShipmentInput } from "@/lib/zod/shipment.schema";
import { useCreateShipment } from "@/app/modules/shipment/server/hooks/use-create-shipment";
import { Package } from "lucide-react";
import { COUNTRIES, getRegionsByCountryCode, type Region } from "@/lib/constants/locations";

type CreateShipmentFormValues = z.input<typeof createShipmentSchema>;

interface CreateShipmentFormProps {
  onSuccess?: (shipmentId: string) => void;
}

export function CreateShipmentForm({ onSuccess }: CreateShipmentFormProps) {
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
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = form;

  // Watch country values to update region options
  const pickupCountry = watch("pickup_facility.country");
  const deliveryCountry = watch("delivery_facility.country");

  // Get region options based on selected country
  const pickupRegions = pickupCountry
    ? getRegionsByCountryCode(pickupCountry).map((r: Region) => ({
      value: r.code,
      label: r.name,
    }))
    : [];

  const deliveryRegions = deliveryCountry
    ? getRegionsByCountryCode(deliveryCountry).map((r: Region) => ({
      value: r.code,
      label: r.name,
    }))
    : [];

  // Country options
  const countryOptions = COUNTRIES.map((c) => ({
    value: c.code,
    label: c.name,
  }));

  // Auto-set region to "Djibouti" when Djibouti country is selected
  useEffect(() => {
    if (pickupCountry === "dj") {
      const djiboutiRegions = getRegionsByCountryCode("dj");
      if (djiboutiRegions.length > 0) {
        setValue("pickup_facility.region", djiboutiRegions[0].code);
      }
    }
  }, [pickupCountry, setValue]);

  useEffect(() => {
    if (deliveryCountry === "dj") {
      const djiboutiRegions = getRegionsByCountryCode("dj");
      if (djiboutiRegions.length > 0) {
        setValue("delivery_facility.region", djiboutiRegions[0].code);
      }
    }
  }, [deliveryCountry, setValue]);

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
          {/* Basic Info and Shipment Details in one row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
          </div>

          <Separator />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Pickup Facility */}
            <div className="rounded-md border p-4 space-y-4">
              <h3 className="text-sm font-semibold">Pickup Address</h3>
              <div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pickup_country">Country</Label>
                    <Controller
                      name="pickup_facility.country"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Auto-set region for Djibouti, otherwise reset
                            if (value === "dj") {
                              const djiboutiRegions = getRegionsByCountryCode("dj");
                              if (djiboutiRegions.length > 0) {
                                setValue("pickup_facility.region", djiboutiRegions[0].code);
                              }
                            } else {
                              setValue("pickup_facility.region", "");
                            }
                          }}
                          value={field.value}
                        >
                          <SelectTrigger id="pickup_country" className="w-full">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countryOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.pickup_facility?.country && (
                      <p className="text-sm text-destructive">
                        {errors.pickup_facility.country.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pickup_region">Region</Label>
                    <Controller
                      name="pickup_facility.region"
                      control={control}
                      render={({ field }) => (
                        <Combobox
                          id="pickup_region"
                          options={pickupRegions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder={pickupCountry ? "Select region" : "Select country first"}
                          searchPlaceholder="Search region..."
                          emptyMessage="No region found."
                          disabled={!pickupCountry || pickupRegions.length === 0}
                          allowCustomValue={false}
                        />
                      )}
                    />
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

                  <div className="space-y-2">
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
            </div>

            {/* Delivery Facility */}
            <div className="rounded-md border p-4 space-y-4">
              <h3 className="text-sm font-semibold">Delivery Address</h3>
              <div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="delivery_country">Country</Label>
                    <Controller
                      name="delivery_facility.country"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Auto-set region for Djibouti, otherwise reset
                            if (value === "dj") {
                              const djiboutiRegions = getRegionsByCountryCode("dj");
                              if (djiboutiRegions.length > 0) {
                                setValue("delivery_facility.region", djiboutiRegions[0].code);
                              }
                            } else {
                              setValue("delivery_facility.region", "");
                            }
                          }}
                          value={field.value}
                        >
                          <SelectTrigger id="delivery_country" className="w-full">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countryOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.delivery_facility?.country && (
                      <p className="text-sm text-destructive">
                        {errors.delivery_facility.country.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery_region">Region</Label>
                    <Controller
                      name="delivery_facility.region"
                      control={control}
                      render={({ field }) => (
                        <Combobox
                          id="delivery_region"
                          options={deliveryRegions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder={deliveryCountry ? "Select region" : "Select country first"}
                          searchPlaceholder="Search region..."
                          emptyMessage="No region found."
                          disabled={!deliveryCountry || deliveryRegions.length === 0}
                          allowCustomValue={false}
                        />
                      )}
                    />
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

                  <div className="space-y-2">
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
            </div>
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
