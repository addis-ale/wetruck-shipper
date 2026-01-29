"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  createContainerSchema,
  CreateContainerInput,
} from "@/lib/zod/container.schema";
import { COUNTRIES } from "@/lib/constants/locations";
import { useCreateContainer } from "../../../server/hooks/use-create-container";


type CreateContainerFormValues = z.input<typeof createContainerSchema>;

type BackendErrorShape =
  | {
      message?: string;
      detail?: unknown;
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

function extractFieldErrors(
  responseData: BackendErrorShape
): Record<string, string> | null {
  const data = responseData as any;

  // { fields: { "a.b": "msg" } }
  if (data?.fields && typeof data.fields === "object") {
    const out: Record<string, string> = {};
    Object.entries(data.fields).forEach(([k, v]) => {
      out[k] = safeString(v) ?? "Invalid value";
    });
    return Object.keys(out).length ? out : null;
  }

  // { errors: { "a.b": ["msg"] } }
  if (data?.errors && typeof data.errors === "object") {
    const out: Record<string, string> = {};
    Object.entries(data.errors).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        out[k] = v.map(safeString).filter(Boolean).join(", ");
      } else {
        out[k] = safeString(v) ?? "Invalid value";
      }
    });
    return Object.keys(out).length ? out : null;
  }

  // FastAPI / Pydantic style
  if (Array.isArray(data?.detail)) {
    const out: Record<string, string> = {};
    data.detail.forEach((item: any) => {
      if (!Array.isArray(item?.loc)) return;
      const path = item.loc
        .filter((p: unknown) => p !== "body")
        .map((p: unknown) => safeString(p))
        .filter(Boolean)
        .join(".");
      if (path) out[path] = safeString(item?.msg) ?? "Invalid value";
    });
    return Object.keys(out).length ? out : null;
  }

  return null;
}

function extractFormMessage(data: BackendErrorShape, fallback: string) {
  const msg =
    safeString((data as any)?.message) ||
    safeString((data as any)?.detail) ||
    safeString((data as any)?.error);
  return msg ?? fallback;
}


export function CreateContainerDialog() {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const defaultValues = useMemo<CreateContainerFormValues>(
    () => ({
      container_number: "",
      container_size: "twenty_feet",
      container_type: "dry",

      gross_weight: 1, 
      gross_weight_unit: "kg",
      tare_weight: undefined,


      container_details: {
        commodity: [""],
        instruction: "",
      },

      return_location_info: {
        country: undefined as any, // must be chosen
        city: "",
        port: "",
        address: "",
      },

      sequencing_priority: 1,
      is_returning: true,

      // backend allows optional, but UI wants selection; keep default
      recommended_truck_type: "flatbed",
    }),
    []
  );

  const form = useForm<CreateContainerFormValues>({
    resolver: zodResolver(createContainerSchema),
    defaultValues,
    mode: "onChange",
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = form;

  const isReturning = watch("is_returning");

  const commodities = useFieldArray({
    control: control as any,
    name: "container_details.commodity",
  });

  const countryOptions = COUNTRIES.map((c) => ({
    value: c.code,
    label: c.name,
  }));

  const { mutateAsync, isPending } = useCreateContainer({
    onSuccess: () => {
      setFormError(null);
      setOpen(false);
      reset(defaultValues);
    },
  });

  const submitting = isSubmitting || isPending;

  async function onSubmit(values: CreateContainerFormValues) {
    setFormError(null);

    Object.keys(errors).forEach((field) => {
      setError(field as any, undefined as any);
    });

    try {
      const parsed = createContainerSchema.parse(values);

      const payload: CreateContainerInput = {
        ...parsed,

        container_details: parsed.container_details
          ? {
              ...parsed.container_details,
              commodity:
                parsed.container_details.commodity
                  ?.map((c) => c.trim())
                  .filter(Boolean) || [],
              instruction: parsed.container_details.instruction?.trim() ?? "",
            }
          : undefined,

        return_location_info: parsed.is_returning
          ? parsed.return_location_info
          : undefined,
      };

      await mutateAsync(payload);
    } catch (err: any) {
      const responseData = err?.response?.data ?? err;

      const fieldErrors = extractFieldErrors(responseData);
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([path, message]) => {
          setError(path as any, { type: "server", message });
        });
        return;
      }

      setFormError(
        extractFormMessage(
          responseData,
          "Failed to create container. Please review your inputs and try again."
        )
      );
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Add Container</Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setFormError(null);
            reset(defaultValues);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Container</DialogTitle>
            <DialogDescription>
              Fill the container details and save.
            </DialogDescription>
          </DialogHeader>

          {/* ====================== FORM ====================== */}
          <form
            id="create-container-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto pr-1 space-y-6"
          >
            {/* ================= TOP FIELDS ================= */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Container Number */}
              <div className="space-y-2">
                <Label htmlFor="container_number" required>
                  Container Number
                </Label>
                <Input id="container_number" {...register("container_number")} />
                {errors.container_number && (
                  <p className="text-sm text-destructive">
                    {errors.container_number.message}
                  </p>
                )}
              </div>

              {/* Sequencing Priority */}
              <div className="space-y-2">
                <Label htmlFor="sequencing_priority">
                  Sequencing Priority
                </Label>
                <Input
                  id="sequencing_priority"
                  type="number"
                  min={1}
                  {...register("sequencing_priority")}
                />
                {errors.sequencing_priority && (
                  <p className="text-sm text-destructive">
                    {errors.sequencing_priority.message}
                  </p>
                )}
              </div>

              {/* Container Size */}
              <div className="space-y-2">
                <Label htmlFor="container_size">Container Size</Label>
                <Controller
                  name="container_size"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="container_size">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="twenty_feet">20 Feet</SelectItem>
                        <SelectItem value="forty_feet">40 Feet</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.container_size && (
                  <p className="text-sm text-destructive">
                    {errors.container_size.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="container_type">Container Type</Label>
                <Controller
                  name="container_type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="container_type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dry">Dry</SelectItem>
                        <SelectItem value="reefer">Reefer</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.container_type && (
                  <p className="text-sm text-destructive">
                    {errors.container_type.message}
                  </p>
                )}
              </div>

              {/* Recommended Truck Type (kept as you had) */}
              <div className="space-y-2">
                <Label htmlFor="recommended_truck_type">
                  Recommended Truck Type
                </Label>

                <Controller<CreateContainerFormValues, "recommended_truck_type">
                  name="recommended_truck_type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? undefined}
                    >
                      <SelectTrigger className="w-full" id="recommended_truck_type">
                        <SelectValue placeholder="Select truck type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flatbed">Flatbed</SelectItem>
                        <SelectItem value="trailer">Trailer</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />

                {errors.recommended_truck_type && (
                  <p className="text-sm text-destructive">
                    {errors.recommended_truck_type.message as any}
                  </p>
                )}
              </div>

              {/* Gross Weight */}
              <div className="space-y-2">
                <Label htmlFor="gross_weight">Gross Weight</Label>
                <Input
                  id="gross_weight"
                  type="number"
                  min={0}
                  {...register("gross_weight")}
                />
                {errors.gross_weight && (
                  <p className="text-sm text-destructive">
                    {errors.gross_weight.message}
                  </p>
                )}
              </div>

              {/* Gross Weight Unit */}
              <div className="space-y-2">
                <Label htmlFor="gross_weight_unit">
                  Gross Weight Unit
                </Label>
                <Controller
                  name="gross_weight_unit"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || "kg"}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="gross_weight_unit">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="ton">ton</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.gross_weight_unit && (
                  <p className="text-sm text-destructive">
                    {errors.gross_weight_unit.message}
                  </p>
                )}
              </div>

              {/* Tare Weight */}
              <div className="space-y-2">
                <Label htmlFor="tare_weight">Tare Weight</Label>
                <Input
                  id="tare_weight"
                  type="number"
                  min={0}
                  {...register("tare_weight")}
                />
                {errors.tare_weight && (
                  <p className="text-sm text-destructive">
                    {errors.tare_weight.message}
                  </p>
                )}
              </div>

              {/* Is Returning */}
              <div className="space-y-2">
                <Label htmlFor="is_returning">Is Returning?</Label>
                <Select
  value={isReturning ? "yes" : "no"}
  onValueChange={(v) => {
    const returning = v === "yes";

    setValue("is_returning", returning, {
      shouldValidate: true,
      shouldDirty: true,
    });

    if (!returning) {
      setValue("return_location_info", undefined, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }}
>

                  <SelectTrigger id="is_returning">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border p-4 space-y-4">
              <div className="font-medium">Container Details</div>

              <div className="space-y-2">
                <Label htmlFor="instruction">Instruction</Label>
                <Input
                  id="instruction"
                  {...register("container_details.instruction")}
                />
                {errors.container_details?.instruction && (
                  <p className="text-sm text-destructive">
                    {errors.container_details.instruction.message as any}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Commodity</Label>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                  {commodities.fields.map((field, idx) => (
                    <div key={field.id} className="flex gap-2">
                      <Input
                        placeholder={`Commodity ${idx + 1}`}
                        {...register(
                          `container_details.commodity.${idx}` as const
                        )}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => commodities.remove(idx)}
                        disabled={commodities.fields.length === 1}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => commodities.append("")}
                >
                  Add Commodity
                </Button>

                {errors.container_details?.commodity && (
                  <p className="text-sm text-destructive">
                    {errors.container_details.commodity.message as any}
                  </p>
                )}
              </div>
            </div>

            {isReturning && (
              <div className="rounded-md border p-4 space-y-4">
                <div className="font-medium">Return Location</div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Controller
                      name="return_location_info.country"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger id="country">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countryOptions.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.return_location_info?.country && (
                      <p className="text-sm text-destructive">
                        {errors.return_location_info.country.message as any}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      {...register("return_location_info.city")}
                    />
                    {errors.return_location_info?.city && (
                      <p className="text-sm text-destructive">
                        {errors.return_location_info.city.message as any}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="port">Port</Label>
                    <Input
                      id="port"
                      {...register("return_location_info.port")}
                    />
                    {errors.return_location_info?.port && (
                      <p className="text-sm text-destructive">
                        {errors.return_location_info.port.message as any}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      {...register("return_location_info.address")}
                    />
                    {errors.return_location_info?.address && (
                      <p className="text-sm text-destructive">
                        {errors.return_location_info.address.message as any}
                      </p>
                    )}
                  </div>
                </div>

                {errors.return_location_info && typeof errors.return_location_info.message === "string" && (
                  <p className="text-sm text-destructive">
                    {errors.return_location_info.message}
                  </p>
                )}
              </div>
            )}

            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
          </form>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-container-form"
              disabled={submitting || !isValid}
            >
              {submitting ? "Saving..." : "Add Container"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
