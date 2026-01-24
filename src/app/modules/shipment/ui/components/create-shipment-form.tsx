"use client";

import { useMemo, useState } from "react";
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
  createShipmentSchema,
  CreateShipmentInput,
} from "@/lib/zod/shipment.schema";
import { useCreateShipment } from "@/app/modules/shipment/server/hooks/use-create-shipment";
import { Package } from "lucide-react";
import {
  COUNTRIES,
  getRegionsByCountryCode,
  type Region,
} from "@/lib/constants/locations";
import type { SubmitHandler } from "react-hook-form";


type CreateShipmentFormValues = z.infer<typeof createShipmentSchema>;

interface CreateShipmentFormProps {
  onSuccess?: (shipmentId: string) => void;
}

/* ------------------------------------------------------------------ */
/* Backend error normalization helpers (400/422)                         */
/* ------------------------------------------------------------------ */

type BackendErrorShape =
  | {
      message?: unknown;
      detail?: unknown;
      error?: unknown;
      fields?: Record<string, unknown>;
      errors?: unknown;
    }
  | unknown;

function safeString(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  return null;
}

/**
 * Convert backend validation errors to: { "path.to.field": "message" }
 * Supports:
 * - { fields: { "a.b": "msg" } }
 * - { errors: { "a.b": ["msg1","msg2"] } } or string
 * - FastAPI/Pydantic: { detail: [{ loc: ["body","a","b"], msg: "..." }] }
 */
function extractFieldErrors(
  responseData: BackendErrorShape
): Record<string, string> | null {
  const data = responseData as any;

  // 1) App-style: { fields: { field: message } }
  if (data?.fields && typeof data.fields === "object") {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(data.fields as Record<string, unknown>)) {
      out[k] = safeString(v) ?? "Invalid value";
    }
    return Object.keys(out).length ? out : null;
  }

  // 2) Common: { errors: { field: ["msg"] } } or { errors: { field: "msg" } }
  if (data?.errors && typeof data.errors === "object") {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(data.errors as Record<string, unknown>)) {
      if (Array.isArray(v)) {
        out[k] =
          v
            .map((x) => safeString(x))
            .filter(Boolean)
            .join(", ") || "Invalid value";
      } else {
        out[k] = safeString(v) ?? "Invalid value";
      }
    }
    return Object.keys(out).length ? out : null;
  }

  // 3) FastAPI/Pydantic detail list
  if (Array.isArray(data?.detail)) {
    const out: Record<string, string> = {};
    for (const item of data.detail) {
      const loc = Array.isArray(item?.loc) ? item.loc : null;
      const msg = safeString(item?.msg) ?? "Invalid value";
      if (!loc) continue;

      // Remove "body" prefix and join
      const cleaned = loc.filter((p: unknown) => p !== "body");
      const path = cleaned
        .map((p: unknown) => safeString(p) ?? "")
        .filter(Boolean)
        .join(".");

      if (path) out[path] = msg;
    }
    return Object.keys(out).length ? out : null;
  }

  return null;
}

function extractFormMessage(responseData: BackendErrorShape, fallback: string) {
  const data = responseData as any;

  const msg =
    safeString(data?.message) ||
    safeString(data?.error) ||
    safeString(data?.detail) ||
    null;

  return msg ?? fallback;
}

/**
 * Promisify react-query mutate when mutateAsync is not exposed.
 * This avoids adding onError to the hook options (which broke your Container TS types).
 */
function mutateAsPromise<TVars>(
  mutate: (vars: TVars, opts?: any) => void,
  vars: TVars
) {
  return new Promise<void>((resolve, reject) => {
    mutate(vars, {
      onSuccess: () => resolve(),
      onError: (err: unknown) => reject(err),
    });
  });
}

export function CreateShipmentForm({ onSuccess }: CreateShipmentFormProps) {
  const [formError, setFormError] = useState<string | null>(null);

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
    watch,
    setValue,
    setError,
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

  const shipmentMutation = useCreateShipment({
    onSuccess: (shipmentId) => {
      setFormError(null);
      reset(defaultValues);
      onSuccess?.(shipmentId.toString());
    },
  });

  const submitting = shipmentMutation.isPending || isSubmitting;

const onSubmit: SubmitHandler<CreateShipmentFormValues> = async (values) => {

    setFormError(null);

    try {
      // Client-side validation safety (already handled by resolver, but keeps behavior consistent)
      const parsed = createShipmentSchema.parse(values);

      // Use mutateAsync when available, else promisify mutate
      const maybeMutateAsync = (shipmentMutation as any).mutateAsync as
        | ((v: any) => Promise<any>)
        | undefined;

      if (maybeMutateAsync) {
        await maybeMutateAsync(parsed);
      } else {
        await mutateAsPromise(shipmentMutation.mutate as any, parsed);
      }
    } catch (err: any) {
      // Backend error mapping (400/422)
      const responseData = err?.response?.data ?? err;

      const fieldErrors = extractFieldErrors(responseData);
      if (fieldErrors) {
        for (const [fieldPath, message] of Object.entries(fieldErrors)) {
          setError(fieldPath as any, {
            type: "server",
            message,
          });
        }
        return;
      }

      setFormError(
        extractFormMessage(
          responseData,
          "Failed to create shipment. Please review your inputs and try again."
        )
      );
    }
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
              <Label htmlFor="origin" required>
                Origin
              </Label>
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
              <Label htmlFor="destination" required>
                Destination
              </Label>
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
                <p className="text-sm text-destructive">
                  {errors.destination.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickup_date" required>
                Pickup Date
              </Label>
              <Input id="pickup_date" type="date" {...register("pickup_date")} />
              {errors.pickup_date && (
                <p className="text-sm text-destructive">
                  {errors.pickup_date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_date" required>
                Delivery Date
              </Label>
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

          <Separator />

          {/* Shipment Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Shipment Details</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="bill_of_lading_number" required>
                  Bill of Lading Number
                </Label>
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
                <Label htmlFor="pickup_number" required>
                  Pickup Number
                </Label>
                <Input
                  id="pickup_number"
                  {...register("shipment_details.pickup_number")}
                />
                {errors.shipment_details?.pickup_number && (
                  <p className="text-sm text-destructive">
                    {errors.shipment_details.pickup_number.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_number" required>
                  Delivery Number
                </Label>
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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Pickup Facility */}
            <div className="rounded-md border p-4 space-y-4">
              <h3 className="text-sm font-semibold">Pickup Address</h3>
              <div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pickup_country" required>
                      Country
                    </Label>
                    <Controller
                      name="pickup_facility.country"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Reset region when country changes
                            setValue("pickup_facility.region", "");
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
                    <Label htmlFor="pickup_region" required>
                      Region
                    </Label>
                    <Controller
                      name="pickup_facility.region"
                      control={control}
                      render={({ field }) => (
                        <Combobox
                          id="pickup_region"
                          options={pickupRegions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder={
                            pickupCountry ? "Select region" : "Select country first"
                          }
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
                    <Label htmlFor="pickup_name" required>
                      Facility Name
                    </Label>
                    <Input id="pickup_name" {...register("pickup_facility.name")} />
                    {errors.pickup_facility?.name && (
                      <p className="text-sm text-destructive">
                        {errors.pickup_facility.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pickup_address" required>
                      Address
                    </Label>
                    <Input
                      id="pickup_address"
                      {...register("pickup_facility.address")}
                    />
                    {errors.pickup_facility?.address && (
                      <p className="text-sm text-destructive">
                        {errors.pickup_facility.address.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pickup_contact_name" required>
                      Contact Name
                    </Label>
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
                    <Label htmlFor="pickup_contact_phone" required>
                      Contact Phone
                    </Label>
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
                    <Label htmlFor="pickup_contact_email" required>
                      Contact Email
                    </Label>
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
                    <Label htmlFor="delivery_country" required>
                      Country
                    </Label>
                    <Controller
                      name="delivery_facility.country"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Reset region when country changes
                            setValue("delivery_facility.region", "");
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
                    <Label htmlFor="delivery_region" required>
                      Region
                    </Label>
                    <Controller
                      name="delivery_facility.region"
                      control={control}
                      render={({ field }) => (
                        <Combobox
                          id="delivery_region"
                          options={deliveryRegions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder={
                            deliveryCountry ? "Select region" : "Select country first"
                          }
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
                    <Label htmlFor="delivery_name" required>
                      Facility Name
                    </Label>
                    <Input
                      id="delivery_name"
                      {...register("delivery_facility.name")}
                    />
                    {errors.delivery_facility?.name && (
                      <p className="text-sm text-destructive">
                        {errors.delivery_facility.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery_address" required>
                      Address
                    </Label>
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
                    <Label htmlFor="delivery_contact_name" required>
                      Contact Name
                    </Label>
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
                    <Label htmlFor="delivery_contact_phone" required>
                      Contact Phone
                    </Label>
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
                    <Label htmlFor="delivery_contact_email" required>
                      Contact Email
                    </Label>
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

          {/* ✅ Form-level backend error fallback */}
          {formError && (
            <div className="rounded-md border border-destructive bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{formError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormError(null);
                reset(defaultValues);
              }}
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
