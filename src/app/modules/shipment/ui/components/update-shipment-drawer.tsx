"use client";

import { useMemo, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  updateShipmentSchema,
  originDestinationEnum,
  type UpdateShipmentInput,
} from "@/lib/zod/shipment.schema";
import { format, startOfDay } from "date-fns";
import { useUpdateShipment } from "@/app/modules/shipment/server/hooks/use-update-shipment";
import { Package, ChevronRight, ChevronLeft, Check } from "lucide-react";
import {
  COUNTRIES,
  getRegionsByCountryCode,
  type Region,
} from "@/lib/constants/locations";
import type { Shipment } from "@/app/modules/shipment/server/types/shipment.types";
import type { UpdateShipmentPayload } from "@/app/modules/shipment/server/types/shipment.types";

type UpdateShipmentFormValues = z.input<typeof updateShipmentSchema>;

const STEPS = [
  { id: 1, title: "Route & dates" },
  { id: 2, title: "Pickup address" },
  { id: 3, title: "Delivery address" },
] as const;

type OriginDestination = z.infer<typeof originDestinationEnum>;

const LOCATION_TO_BACKEND: Record<OriginDestination, string> = {
  addis_ababa: "Addis Ababa",
  adama: "Adama",
  dukem: "Dukem",
  bishoftu: "Bishoftu",
  debre_zeit: "debre_zeit",
  hawassa: "Hawassa",
  shashemene: "Shashemene",
  djibouti: "Djibouti",
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
};

function toUiLocation(value: string): OriginDestination {
  const mapped = LOCATION_FROM_BACKEND[value];
  if (mapped) return mapped;
  const parsed = originDestinationEnum.safeParse(value);
  if (parsed.success) return parsed.data;
  return "addis_ababa";
}

const ORIGIN_OPTIONS = originDestinationEnum.options.map((o) => ({
  value: o,
  label: o
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" "),
}));
const DESTINATION_OPTIONS = ORIGIN_OPTIONS;

function formatDateForInput(dateString: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
}

function countryToCode(name: string): string {
  const c = COUNTRIES.find((x) => x.name === name || x.code === name);
  return c?.code ?? name;
}

export interface UpdateShipmentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: Shipment;
}

export function UpdateShipmentDrawer({
  open,
  onOpenChange,
  shipment,
}: UpdateShipmentDrawerProps) {
  const [step, setStep] = useState(1);

  const defaultValues = useMemo<UpdateShipmentInput>(
    () => ({
      origin: toUiLocation(shipment.origin),
      destination: toUiLocation(shipment.destination),
      pickup_date: formatDateForInput(shipment.pickup_date),
      delivery_date: formatDateForInput(shipment.delivery_date),
      pickup_facility: {
        country: countryToCode(shipment.pickup_facility?.country ?? ""),
        region: shipment.pickup_facility?.region ?? "",
        name: shipment.pickup_facility?.name ?? "",
        address: shipment.pickup_facility?.address ?? "",
        contact_name: shipment.pickup_facility?.contact_name ?? "",
        contact_phone_number:
          shipment.pickup_facility?.contact_phone_number ?? "",
        contact_email: shipment.pickup_facility?.contact_email ?? "",
      },
      delivery_facility: {
        country: countryToCode(shipment.delivery_facility?.country ?? ""),
        region: shipment.delivery_facility?.region ?? "",
        name: shipment.delivery_facility?.name ?? "",
        address: shipment.delivery_facility?.address ?? "",
        contact_name: shipment.delivery_facility?.contact_name ?? "",
        contact_phone_number:
          shipment.delivery_facility?.contact_phone_number ?? "",
        contact_email: shipment.delivery_facility?.contact_email ?? "",
      },
      shipment_details: {
        bill_of_lading_number:
          shipment.shipment_details?.bill_of_lading_number ?? "",
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
    trigger,
    getValues,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = form;

  const pickupCountry = watch("pickup_facility.country");
  const deliveryCountry = watch("delivery_facility.country");

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
  const countryOptions = COUNTRIES.map((c) => ({
    value: c.code,
    label: c.name,
  }));

  useEffect(() => {
    if (pickupCountry === "dj") {
      const r = getRegionsByCountryCode("dj");
      if (r.length) setValue("pickup_facility.region", r[0].code);
    }
  }, [pickupCountry, setValue]);
  useEffect(() => {
    if (deliveryCountry === "dj") {
      const r = getRegionsByCountryCode("dj");
      if (r.length) setValue("delivery_facility.region", r[0].code);
    }
  }, [deliveryCountry, setValue]);

  useEffect(() => {
    if (open) {
      setStep(1);
      reset(defaultValues);
    }
  }, [open, shipment.id, reset, defaultValues]);

  const { mutate, isPending } = useUpdateShipment(shipment.id, {
    onSuccess: () => {
      onOpenChange(false);
      setStep(1);
      reset(defaultValues);
    },
  });

  const submitting = isPending || isSubmitting;

  const step1Fields = [
    "origin",
    "destination",
    "pickup_date",
    "delivery_date",
    "shipment_details.bill_of_lading_number",
  ] as const;
  const step2Fields = [
    "pickup_facility.country",
    "pickup_facility.region",
    "pickup_facility.name",
    "pickup_facility.address",
    "pickup_facility.contact_name",
    "pickup_facility.contact_phone_number",
    "pickup_facility.contact_email",
  ] as const;
  const step3Fields = [
    "delivery_facility.country",
    "delivery_facility.region",
    "delivery_facility.name",
    "delivery_facility.address",
    "delivery_facility.contact_name",
    "delivery_facility.contact_phone_number",
    "delivery_facility.contact_email",
  ] as const;

  const handleNext = async () => {
    const values = getValues();

    if (step === 1) {
      const required: (keyof UpdateShipmentFormValues)[] = [
        "origin",
        "destination",
        "pickup_date",
        "delivery_date",
      ];
      for (const field of required) {
        const v = values[field];
        if (
          v === undefined ||
          v === null ||
          (typeof v === "string" && !v.trim())
        ) {
          setError(field as keyof UpdateShipmentFormValues, {
            type: "required",
            message: "Required",
          });
          return;
        }
      }
      const bol = values.shipment_details?.bill_of_lading_number?.trim();
      if (!bol) {
        setError("shipment_details.bill_of_lading_number", {
          type: "required",
          message: "Required",
        });
        return;
      }
      const ok = await trigger(
        step1Fields as unknown as (keyof UpdateShipmentFormValues)[],
      );
      if (ok) setStep(2);
    } else if (step === 2) {
      const pf = values.pickup_facility;
      const required = [
        "country",
        "region",
        "name",
        "address",
        "contact_name",
        "contact_phone_number",
      ] as const;
      for (const key of required) {
        const v = pf?.[key];
        if (!v || (typeof v === "string" && !v.trim())) {
          setError(`pickup_facility.${key}` as keyof UpdateShipmentFormValues, {
            type: "required",
            message: "Required",
          });
          return;
        }
      }
      const ok = await trigger(
        step2Fields as unknown as (keyof UpdateShipmentFormValues)[],
      );
      if (ok) setStep(3);
    } else if (step === 3) {
      const df = values.delivery_facility;
      const required = [
        "country",
        "region",
        "name",
        "address",
        "contact_name",
        "contact_phone_number",
      ] as const;
      for (const key of required) {
        const v = df?.[key];
        if (!v || (typeof v === "string" && !v.trim())) {
          setError(
            `delivery_facility.${key}` as keyof UpdateShipmentFormValues,
            { type: "required", message: "Required" },
          );
          return;
        }
      }
      await trigger(
        step3Fields as unknown as (keyof UpdateShipmentFormValues)[],
      );
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  function onSubmit(values: UpdateShipmentFormValues) {
    const originKey = values.origin as OriginDestination | undefined;
    const destinationKey = values.destination as OriginDestination | undefined;
    const payload: UpdateShipmentPayload = {
      ...values,
      origin: originKey
        ? (LOCATION_TO_BACKEND[originKey] as UpdateShipmentPayload["origin"])
        : undefined,
      destination: destinationKey
        ? (LOCATION_TO_BACKEND[
          destinationKey
        ] as UpdateShipmentPayload["destination"])
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
    mutate(payload);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex flex-col rounded-t-xl p-0">
        <SheetHeader className="shrink-0 border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <SheetTitle className="text-lg">Edit shipment</SheetTitle>
          </div>
          <div className="flex gap-1 mt-2">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`h-1 flex-1 rounded-full ${s.id <= step ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Step {step} of 3 · {STEPS[step - 1].title}
          </p>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <form
            id="update-shipment-drawer-form"
            onSubmit={handleSubmit(onSubmit)}
            className="p-4 pb-24 space-y-4"
          >
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Origin</Label>
                    <Controller
                      name="origin"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select origin" />
                          </SelectTrigger>
                          <SelectContent>
                            {ORIGIN_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.origin && (
                      <p className="text-sm text-destructive">
                        {errors.origin.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Destination</Label>
                    <Controller
                      name="destination"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select destination" />
                          </SelectTrigger>
                          <SelectContent>
                            {DESTINATION_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Pickup date</Label>
                    <Controller
                      name="pickup_date"
                      control={control}
                      render={({ field }) => (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              {field.value
                                ? format(
                                  (field.value as unknown) instanceof Date
                                    ? (field.value as unknown as Date)
                                    : new Date(field.value),
                                  "PPP",
                                )
                                : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            side="top"
                            align="start"
                            className="w-auto max-h-[min(70vh,320px)] overflow-auto p-0"
                          >
                            <Calendar
                              mode="single"
                              selected={
                                field.value
                                  ? (field.value as unknown) instanceof Date
                                    ? (field.value as unknown as Date)
                                    : new Date(field.value)
                                  : undefined
                              }
                              onSelect={(date) =>
                                field.onChange(
                                  date ? format(date, "yyyy-MM-dd") : "",
                                )
                              }
                              disabled={(date) => date < startOfDay(new Date())}
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                    {errors.pickup_date && (
                      <p className="text-sm text-destructive">
                        {errors.pickup_date.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Delivery date</Label>
                    <Controller
                      name="delivery_date"
                      control={control}
                      render={({ field }) => (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              {field.value
                                ? format(
                                  (field.value as unknown) instanceof Date
                                    ? (field.value as unknown as Date)
                                    : new Date(field.value),
                                  "PPP",
                                )
                                : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            side="top"
                            align="start"
                            className="w-auto max-h-[min(70vh,320px)] overflow-auto p-0"
                          >
                            <Calendar
                              mode="single"
                              selected={
                                field.value
                                  ? (field.value as unknown) instanceof Date
                                    ? (field.value as unknown as Date)
                                    : new Date(field.value)
                                  : undefined
                              }
                              onSelect={(date) =>
                                field.onChange(
                                  date ? format(date, "yyyy-MM-dd") : "",
                                )
                              }
                              disabled={(date) => date < startOfDay(new Date())}
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                    {errors.delivery_date && (
                      <p className="text-sm text-destructive">
                        {errors.delivery_date.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Bill of lading number</Label>
                  <Input
                    placeholder="Optional"
                    {...register("shipment_details.bill_of_lading_number")}
                  />
                  {errors.shipment_details?.bill_of_lading_number && (
                    <p className="text-sm text-destructive">
                      {errors.shipment_details.bill_of_lading_number.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Pickup address</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Controller
                        name="pickup_facility.country"
                        control={control}
                        render={({ field }) => (
                          <Select
                            onValueChange={(v) => {
                              field.onChange(v);
                              if (v === "dj") {
                                const r = getRegionsByCountryCode("dj");
                                if (r.length)
                                  setValue("pickup_facility.region", r[0].code);
                              } else setValue("pickup_facility.region", "");
                            }}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              {countryOptions.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
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
                      <Label>Region</Label>
                      <Controller
                        name="pickup_facility.region"
                        control={control}
                        render={({ field }) => (
                          <Combobox
                            options={pickupRegions}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder={
                              pickupCountry
                                ? "Select region"
                                : "Select country first"
                            }
                            searchPlaceholder="Search region..."
                            emptyMessage="No region found."
                            disabled={
                              !pickupCountry || pickupRegions.length === 0
                            }
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
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Clearance agent name</Label>
                      <Input
                        placeholder="Name"
                        {...register("pickup_facility.name")}
                      />
                      {errors.pickup_facility?.name && (
                        <p className="text-sm text-destructive">
                          {errors.pickup_facility.name.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Contact name</Label>
                      <Input {...register("pickup_facility.contact_name")} />
                      {errors.pickup_facility?.contact_name && (
                        <p className="text-sm text-destructive">
                          {errors.pickup_facility.contact_name.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Contact phone</Label>
                      <Input
                        {...register("pickup_facility.contact_phone_number")}
                      />
                      {errors.pickup_facility?.contact_phone_number && (
                        <p className="text-sm text-destructive">
                          {errors.pickup_facility.contact_phone_number.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Contact email</Label>
                      <Input
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
                  <div className="space-y-2">
                    <Label>Loading address</Label>
                    <Input {...register("pickup_facility.address")} />
                    {errors.pickup_facility?.address && (
                      <p className="text-sm text-destructive">
                        {errors.pickup_facility.address.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Delivery address</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Controller
                        name="delivery_facility.country"
                        control={control}
                        render={({ field }) => (
                          <Select
                            onValueChange={(v) => {
                              field.onChange(v);
                              if (v === "dj") {
                                const r = getRegionsByCountryCode("dj");
                                if (r.length)
                                  setValue(
                                    "delivery_facility.region",
                                    r[0].code,
                                  );
                              } else setValue("delivery_facility.region", "");
                            }}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              {countryOptions.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
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
                      <Label>Region</Label>
                      <Controller
                        name="delivery_facility.region"
                        control={control}
                        render={({ field }) => (
                          <Combobox
                            options={deliveryRegions}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder={
                              deliveryCountry
                                ? "Select region"
                                : "Select country first"
                            }
                            searchPlaceholder="Search region..."
                            emptyMessage="No region found."
                            disabled={
                              !deliveryCountry || deliveryRegions.length === 0
                            }
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
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Clearance agent name</Label>
                      <Input
                        placeholder="Name"
                        {...register("delivery_facility.name")}
                      />
                      {errors.delivery_facility?.name && (
                        <p className="text-sm text-destructive">
                          {errors.delivery_facility.name.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Contact name</Label>
                      <Input {...register("delivery_facility.contact_name")} />
                      {errors.delivery_facility?.contact_name && (
                        <p className="text-sm text-destructive">
                          {errors.delivery_facility.contact_name.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Contact phone</Label>
                      <Input
                        {...register("delivery_facility.contact_phone_number")}
                      />
                      {errors.delivery_facility?.contact_phone_number && (
                        <p className="text-sm text-destructive">
                          {
                            errors.delivery_facility.contact_phone_number
                              .message
                          }
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Contact email</Label>
                      <Input
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
                  <div className="space-y-2">
                    <Label>Off loading address</Label>
                    <Input {...register("delivery_facility.address")} />
                    {errors.delivery_facility?.address && (
                      <p className="text-sm text-destructive">
                        {errors.delivery_facility.address.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="shrink-0 border-t bg-background p-4 flex gap-2">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={submitting}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          {step < 3 ? (
            <Button type="button" onClick={handleNext} className="flex-1">
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              disabled={submitting || !isValid}
              onClick={() => handleSubmit(onSubmit)()}
              className="flex-1"
            >
              {submitting ? (
                "Saving..."
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Save changes
                </>
              )}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
