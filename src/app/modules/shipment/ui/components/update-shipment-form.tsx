"use client";

import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import {
  updateShipmentSchema,
  originDestinationEnum,
  UpdateShipmentInput,
} from "@/lib/zod/shipment.schema";
import { useUpdateShipment } from "@/app/modules/shipment/server/hooks/use-update-shipment";
import { Package } from "lucide-react";
import type {
  Shipment,
  UpdateShipmentPayload,
} from "@/app/modules/shipment/server/types/shipment.types";
import {
  COUNTRIES,
  getRegionsByCountryCode,
  type Region,
} from "@/lib/constants/locations";

/* -------------------------------------------------------------------------- */
/* Types & Helpers                                                            */
/* -------------------------------------------------------------------------- */

type UpdateShipmentFormValues = z.input<typeof updateShipmentSchema>;
type OriginDestination = z.infer<typeof originDestinationEnum>;

interface UpdateShipmentFormProps {
  shipment: Shipment;
  onSuccess?: () => void;
  /** When "drawer", renders only the form (no Card wrapper) for use inside a sheet */
  variant?: "card" | "drawer";
}

const LOCATION_TO_BACKEND: Record<OriginDestination, string> = {
  addis_ababa: "Addis Ababa",
  adama: "Adama",
  dukem: "Dukem",
  bishoftu: "Bishoftu",
  debre_zeit: "debre_zeit",
  hawassa: "Hawassa",
  shashemene: "Shashemene",
  djibouti: "Djibouti",
  djibouti_port: "Djibouti Port",
};

const LOCATION_FROM_BACKEND: Record<string, OriginDestination> = {
  "Addis Ababa": "addis_ababa",
  Adama: "adama",
  Dukem: "dukem",
  Bishoftu: "bishoftu",
  debre_zeit: "debre_zeit",
  Hawassa: "hawassa",
  Shashemene: "shashemene",
  Djibouti: "djibouti",
  "Djibouti Port": "djibouti_port",
};

function toUiLocation(value: string): OriginDestination {
  const mapped = LOCATION_FROM_BACKEND[value];
  if (mapped) return mapped;
  const parsed = originDestinationEnum.safeParse(value);
  if (parsed.success) return parsed.data;
  return "addis_ababa";
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

export function UpdateShipmentForm({
  shipment,
  onSuccess,
  variant = "card",
}: UpdateShipmentFormProps) {
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const defaultValues = useMemo<UpdateShipmentInput>(
    () => ({
      origin: toUiLocation(shipment.origin),
      destination: toUiLocation(shipment.destination),
      pickup_date: formatDateForInput(shipment.pickup_date),
      delivery_date: formatDateForInput(shipment.delivery_date),
      pickup_facility: {
        country: shipment.pickup_facility?.country || "",
        region: shipment.pickup_facility?.region || "",
        name: shipment.pickup_facility?.name || "",
        address: shipment.pickup_facility?.address || "",
        contact_name: shipment.pickup_facility?.contact_name || "",
        contact_phone_number:
          shipment.pickup_facility?.contact_phone_number || "",
        contact_email: shipment.pickup_facility?.contact_email || "",
      },
      delivery_facility: {
        country: shipment.delivery_facility?.country || "",
        region: shipment.delivery_facility?.region || "",
        name: shipment.delivery_facility?.name || "",
        address: shipment.delivery_facility?.address || "",
        contact_name: shipment.delivery_facility?.contact_name || "",
        contact_phone_number:
          shipment.delivery_facility?.contact_phone_number || "",
        contact_email: shipment.delivery_facility?.contact_email || "",
      },
      shipment_details: {
        bill_of_lading_number:
          shipment.shipment_details?.bill_of_lading_number || "",
      },
      status: shipment.status,
    }),
    [shipment],
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
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = form;

  const pickupCountry = watch("pickup_facility.country");
  const deliveryCountry = watch("delivery_facility.country");

  const pickupRegions = useMemo(
    () =>
      pickupCountry
        ? getRegionsByCountryCode(pickupCountry).map((r: Region) => ({
            value: r.code,
            label: r.name,
          }))
        : [],
    [pickupCountry],
  );

  const deliveryRegions = useMemo(
    () =>
      deliveryCountry
        ? getRegionsByCountryCode(deliveryCountry).map((r: Region) => ({
            value: r.code,
            label: r.name,
          }))
        : [],
    [deliveryCountry],
  );

  const countryOptions = COUNTRIES.map((c) => ({
    value: c.code,
    label: c.name,
  }));

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
    const originKey = values.origin as OriginDestination;
    const destinationKey = values.destination as OriginDestination;

    // We prepare the final payload for the backend
    const payload = {
      ...values,
      origin: originKey ? LOCATION_TO_BACKEND[originKey] : undefined,
      destination: destinationKey
        ? LOCATION_TO_BACKEND[destinationKey]
        : undefined,
      pickup_date: values.pickup_date
        ? new Date(values.pickup_date).toISOString()
        : undefined,
      delivery_date: values.delivery_date
        ? new Date(values.delivery_date).toISOString()
        : undefined,
      shipment_details: values.shipment_details?.bill_of_lading_number
        ? {
            bill_of_lading_number:
              values.shipment_details.bill_of_lading_number,
          }
        : undefined,
    };

    mutate(payload as UpdateShipmentPayload);
  }

  const formatLocation = (location: string) => {
    return location
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="origin">Origin *</Label>
          <Controller
            name="origin"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                value={field.value as string}
              >
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
              <Select
                onValueChange={field.onChange}
                value={field.value as string}
              >
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
            <p className="text-sm text-destructive">
              {errors.destination.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pickup_date">Pickup Date *</Label>
          <Input id="pickup_date" type="date" {...register("pickup_date")} />
          {errors.pickup_date && (
            <p className="text-sm text-destructive">
              {errors.pickup_date.message}
            </p>
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
            <p className="text-sm text-destructive">
              {errors.delivery_date.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <h3 className="text-sm font-semibold">Pickup Address</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6 border-l-2">
            <div className="space-y-2">
              <Label>Country *</Label>
              <Controller
                name="pickup_facility.country"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val);
                      setValue("pickup_facility.region", "");
                    }}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countryOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Region *</Label>
              <Controller
                name="pickup_facility.region"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={pickupRegions}
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    disabled={!pickupCountry}
                    placeholder="Select region"
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Clearance Agent Name</Label>
              <Input {...register("pickup_facility.name")} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input {...register("pickup_facility.address")} />
            </div>
            <div className="space-y-2">
              <Label>Contact Name</Label>
              <Input {...register("pickup_facility.contact_name")} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input {...register("pickup_facility.contact_phone_number")} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <h3 className="text-sm font-semibold">Delivery Address</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6 border-l-2">
            <div className="space-y-2">
              <Label>Country *</Label>
              <Controller
                name="delivery_facility.country"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val);
                      setValue("delivery_facility.region", "");
                    }}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countryOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Region *</Label>
              <Controller
                name="delivery_facility.region"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={deliveryRegions}
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    disabled={!deliveryCountry}
                    placeholder="Select region"
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Clearance Agent Name</Label>
              <Input {...register("delivery_facility.name")} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input {...register("delivery_facility.address")} />
            </div>
            <div className="space-y-2">
              <Label>Contact Name</Label>
              <Input {...register("delivery_facility.contact_name")} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input {...register("delivery_facility.contact_phone_number")} />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="font-medium">Shipment Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bol">Bill of Lading Number</Label>
            <Input
              id="bol"
              {...register("shipment_details.bill_of_lading_number")}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset(defaultValues)}
        >
          Reset
        </Button>
        <Button type="submit" disabled={submitting || !isValid}>
          {submitting ? "Updating..." : "Update Shipment"}
        </Button>
      </div>
    </form>
  );

  if (variant === "drawer") {
    return formContent;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Update Shipment</CardTitle>
        <CardDescription>
          Update shipment details and information
        </CardDescription>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}
