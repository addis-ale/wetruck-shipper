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
  createShipmentSchema,
  CreateShipmentInput,
} from "@/lib/zod/shipment.schema";
import { format, startOfDay } from "date-fns";
import { useCreateShipment } from "@/app/modules/shipment/server/hooks/use-create-shipment";
import { Package, ChevronRight, ChevronLeft, Check } from "lucide-react";
import {
  COUNTRIES,
  getRegionsByCountryCode,
  type Region,
} from "@/lib/constants/locations";

type CreateShipmentFormValues = z.input<typeof createShipmentSchema>;

const STEPS = [
  { id: 1, title: "Route & dates" },
  { id: 2, title: "Pickup address" },
  { id: 3, title: "Delivery address" },
] as const;

const ORIGIN_OPTIONS = [
  { value: "addis_ababa", label: "Addis Ababa" },
  { value: "adama", label: "Adama" },
  { value: "dukem", label: "Dukem" },
  { value: "debre_zeit", label: "Debre Zeit" },
  { value: "hawassa", label: "Hawassa" },
  { value: "shashemene", label: "Shashemene" },
  { value: "djibouti", label: "Djibouti" },
];

const DESTINATION_OPTIONS = [
  { value: "addis_ababa", label: "Addis Ababa" },
  { value: "adama", label: "Adama" },
  { value: "dukem", label: "Dukem" },
  { value: "debre_zeit", label: "Debre Zeit" },
  { value: "hawassa", label: "Hawassa" },
  { value: "shashemene", label: "Shashemene" },
];

interface CreateShipmentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (shipmentId: string) => void;
  onCancel?: () => void;
}

export function CreateShipmentDrawer({
  open,
  onOpenChange,
  onSuccess,
  onCancel,
}: CreateShipmentDrawerProps) {
  const [step, setStep] = useState(1);

  const defaultValues = useMemo<CreateShipmentInput>(
    () => ({
      origin: "" as unknown as CreateShipmentInput["origin"],
      destination: "" as unknown as CreateShipmentInput["destination"],
      pickup_date: "",
      delivery_date: "",
      status: "created",
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
    }),
    [],
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

  useEffect(() => {
    if (!open) {
      setStep(1);
      reset(defaultValues);
    }
  }, [open, reset, defaultValues]);

  const { mutate, isPending } = useCreateShipment({
    onSuccess: (shipmentId) => {
      reset(defaultValues);
      setStep(1);
      onSuccess?.(shipmentId.toString());
      onOpenChange(false);
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
    let canProceed = true;

    if (step === 1) {
      const required: (keyof CreateShipmentFormValues)[] = [
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
          setError(field, { type: "required", message: "Required" });
          canProceed = false;
        }
      }
      const bol = values.shipment_details?.bill_of_lading_number?.trim();
      if (!bol) {
        setError("shipment_details.bill_of_lading_number", {
          type: "required",
          message: "Required",
        });
        canProceed = false;
      }
      if (!canProceed) return;
      const ok = await trigger(step1Fields);
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
          setError(`pickup_facility.${key}`, {
            type: "required",
            message: "Required",
          });
          canProceed = false;
        }
      }
      if (!canProceed) return;
      const ok = await trigger(step2Fields);
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
          setError(`delivery_facility.${key}`, {
            type: "required",
            message: "Required",
          });
          canProceed = false;
        }
      }
      if (!canProceed) return;
      const ok = await trigger(step3Fields);
      if (ok) setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  function onSubmit(values: CreateShipmentFormValues) {
    const parsed = createShipmentSchema.parse({
      ...values,
      pickup_date: new Date(values.pickup_date).toISOString(),
      delivery_date: new Date(values.delivery_date).toISOString(),
    });
    mutate(parsed);
  }

  watch();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex flex-col rounded-t-xl p-0">
        <SheetHeader className="shrink-0 border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <SheetTitle className="text-lg">Create shipment</SheetTitle>
          </div>
          <div className="flex gap-1 mt-2">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`h-1 flex-1 rounded-full ${
                  s.id <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Step {step} of 3 · {STEPS[step - 1].title}
          </p>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <form
            id="create-shipment-form"
            onSubmit={handleSubmit(onSubmit)}
            className="p-4 pb-24 space-y-4"
          >
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">Origin</Label>
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
                    <Label className="text-xs sm:text-sm">Destination</Label>
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
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">Pickup date</Label>
                    <Controller
                      name="pickup_date"
                      control={control}
                      render={({ field }) => (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal text-xs sm:text-sm truncate"
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
                      <p className="text-xs text-destructive">
                        {errors.pickup_date.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">Delivery date</Label>
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
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm">Country</Label>
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
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
              onClick={() => {
                onCancel?.();
                onOpenChange(false);
              }}
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
                "Creating..."
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Create shipment
                </>
              )}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
