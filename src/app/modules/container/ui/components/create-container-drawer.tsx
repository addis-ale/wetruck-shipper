"use client";

import { useMemo, useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useFieldArray,
  useForm,
  Controller,
  type Path,
  type FieldArrayPath,
} from "react-hook-form";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  createContainerSchema,
  CreateContainerInput,
} from "@/lib/zod/container.schema";
import { COUNTRIES } from "@/lib/constants/locations";
import { useCreateContainer } from "../../server/hooks/use-create-container";
import type { Container } from "../../server/types/container.types";
import { toast } from "sonner";
import { Box, ChevronLeft, ChevronRight, Check } from "lucide-react";

type CreateContainerFormValues = z.input<typeof createContainerSchema>;

const STEPS = [
  { id: 1, title: "Basic info" },
  { id: 2, title: "Details & cargo" },
  { id: 3, title: "Return location" },
] as const;

type BackendErrorShape = {
  message?: string;
  detail?: unknown;
  fields?: Record<string, unknown>;
  errors?: unknown;
  response?: { data?: BackendErrorShape };
};

interface BackendErrorWithFields {
  fields?: Record<string, unknown>;
  errors?: Record<string, unknown>;
  detail?: Array<{ loc?: unknown[]; msg?: string; type?: string }>;
  message?: string;
  error?: string;
}

function safeString(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  return null;
}

function extractFieldErrors(
  responseData: BackendErrorShape,
): Record<string, string> | null {
  const data = responseData as BackendErrorWithFields;
  if (data?.fields && typeof data.fields === "object") {
    const out: Record<string, string> = {};
    Object.entries(data.fields).forEach(([k, v]) => {
      out[k] = safeString(v) ?? "Invalid value";
    });
    return Object.keys(out).length ? out : null;
  }
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
  if (Array.isArray(data?.detail)) {
    const out: Record<string, string> = {};
    data.detail.forEach((item: unknown) => {
      const errorItem = item as { loc?: unknown[]; msg?: string };
      if (!Array.isArray(errorItem?.loc)) return;
      const path = errorItem.loc
        .filter((p: unknown) => p !== "body")
        .map((p: unknown) => safeString(p))
        .filter(Boolean)
        .join(".");
      if (path) out[path] = safeString(errorItem?.msg) ?? "Invalid value";
    });
    return Object.keys(out).length ? out : null;
  }
  return null;
}

function extractFormMessage(data: BackendErrorShape, fallback: string) {
  const errorData = data as BackendErrorWithFields;
  const msg =
    safeString(errorData?.message) ||
    safeString(errorData?.detail) ||
    safeString(errorData?.error);
  return msg ?? fallback;
}

export interface CreateContainerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (container: Container) => void;
}

export function CreateContainerDrawer({
  open,
  onOpenChange,
  onCreated,
}: CreateContainerDrawerProps) {
  const [step, setStep] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);

  const defaultValues = useMemo<CreateContainerFormValues>(
    () => ({
      container_number: "",
      container_size: "twenty_feet",
      container_type: "dry",
      gross_weight: 1,
      gross_weight_unit: "kg",
      tare_weight: undefined,
      container_details: { commodity: [""], instruction: "" },
      return_location_info: { country: "", city: "", port: "", address: "" },
      sequencing_priority: 1,
      is_returning: true,
      recommended_truck_type: "flatbed",
    }),
    [],
  );

  const form = useForm<CreateContainerFormValues>({
    resolver: zodResolver(createContainerSchema),
    defaultValues,
    mode: "onChange",
  });

  const {
    register,
    watch,
    reset,
    control,
    setValue,
    setError,
    clearErrors,
    trigger,
    getValues,
    formState: { errors, isSubmitting },
  } = form;

  const isReturning = watch("is_returning");
  const returnCountry = watch("return_location_info.country");

  const commodities = useFieldArray({
    control,
    name: "container_details.commodity" as FieldArrayPath<CreateContainerFormValues>,
  });

  useEffect(() => {
    if (returnCountry && returnCountry !== "Djibouti") {
      setValue("return_location_info.port", undefined as unknown as string, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [returnCountry, setValue]);

  useEffect(() => {
    if (!open) {
      setStep(1);
      reset(defaultValues);
      setFormError(null);
    }
  }, [open, reset, defaultValues]);

  const countryOptions = COUNTRIES.filter(
    (c) => c.name === "Djibouti" || c.name === "Ethiopia",
  ).map((c) => ({ value: c.name, label: c.name }));

  const { mutateAsync, isPending } = useCreateContainer({
    onSuccess: (container) => {
      toast.success("Container created successfully");
      setFormError(null);
      onOpenChange(false);
      reset(defaultValues);
      setStep(1);
      onCreated?.(container);
    },
  });

  const submitting = isSubmitting || isPending;

  const step1Fields = [
    "container_number",
    "container_size",
    "container_type",
    "gross_weight",
    "gross_weight_unit",
    "sequencing_priority",
    "recommended_truck_type",
  ] as const;
  const step2Fields = [
    "container_details.instruction",
    "container_details.commodity",
  ] as const;
  const step3Fields = [
    "return_location_info.country",
    "return_location_info.city",
    "return_location_info.address",
  ] as const;

  const handleNext = async () => {
    setFormError(null);
    clearErrors();

    if (step === 1) {
      const values = getValues();
      if (!values.container_number?.trim()) {
        setError("container_number", { type: "required", message: "Required" });
        return;
      }
      if (!values.gross_weight || Number(values.gross_weight) <= 0) {
        setError("gross_weight", { type: "required", message: "Required" });
        return;
      }
      const ok = await trigger(
        step1Fields as unknown as Path<CreateContainerFormValues>[],
      );
      if (ok) setStep(2);
    } else if (step === 2) {
      const values = getValues();
      const inst = values.container_details?.instruction?.trim();
      if (!inst) {
        setError("container_details.instruction", {
          type: "required",
          message: "Required",
        });
        return;
      }
      const comm = values.container_details?.commodity
        ?.map((c) => (typeof c === "string" ? c.trim() : ""))
        .filter(Boolean);
      if (!comm?.length) {
        setError("container_details.commodity", {
          type: "required",
          message: "At least one cargo description required",
        });
        return;
      }
      const ok = await trigger(
        step2Fields as unknown as Path<CreateContainerFormValues>[],
      );
      if (!ok) return;
      if (isReturning) {
        setStep(3);
      } else {
        await onSubmit(getValues());
      }
    } else if (step === 3) {
      const values = getValues();
      const r = values.return_location_info;
      if (!r?.country?.trim() || !r?.city?.trim() || !r?.address?.trim()) {
        if (!r?.country?.trim())
          setError("return_location_info.country", {
            type: "required",
            message: "Required",
          });
        if (!r?.city?.trim())
          setError("return_location_info.city", {
            type: "required",
            message: "Required",
          });
        if (!r?.address?.trim())
          setError("return_location_info.address", {
            type: "required",
            message: "Required",
          });
        return;
      }
      if (returnCountry === "Djibouti" && !r?.port?.trim()) {
        setError("return_location_info.port", {
          type: "required",
          message: "Port required for Djibouti",
        });
        return;
      }
      const ok = await trigger(
        step3Fields as unknown as Path<CreateContainerFormValues>[],
      );
      if (ok) await onSubmit(getValues());
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  async function onSubmit(values: CreateContainerFormValues) {
    setFormError(null);
    clearErrors();
    try {
      const parsed = createContainerSchema.parse(values);
      let returnLocationInfo: CreateContainerInput["return_location_info"] =
        undefined;
      if (parsed.is_returning && parsed.return_location_info) {
        const { country, city, port, address } = parsed.return_location_info;
        if (country === "Djibouti") {
          returnLocationInfo = {
            country,
            city: city?.trim() || "",
            port: port?.trim() || "",
            address: address?.trim() || "",
          };
        } else if (country === "Ethiopia") {
          returnLocationInfo = {
            country,
            city: city?.trim() || "",
            address: address?.trim() || "",
          };
        }
      }
      const payload: CreateContainerInput = {
        container_number: parsed.container_number,
        container_size: parsed.container_size,
        container_type: parsed.container_type,
        gross_weight: parsed.gross_weight,
        gross_weight_unit: parsed.gross_weight_unit,
        tare_weight: parsed.tare_weight,
        sequencing_priority: parsed.sequencing_priority,
        recommended_truck_type: parsed.recommended_truck_type,
        is_returning: parsed.is_returning,
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
        return_location_info: returnLocationInfo,
      };
      await mutateAsync(payload);
    } catch (err: unknown) {
      const error = err as { response?: { data?: BackendErrorShape } };
      const responseData = error?.response?.data ?? error;
      const fieldErrors = extractFieldErrors(responseData);
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([path, message]) => {
          setError(path as Path<CreateContainerFormValues>, {
            type: "server",
            message,
          });
        });
        return;
      }
      setFormError(
        extractFormMessage(
          responseData,
          "Failed to create container. Please try again.",
        ),
      );
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex flex-col rounded-t-xl p-0">
        <SheetHeader className="shrink-0 border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Box className="h-4 w-4 text-primary" strokeWidth={2} />
            </div>
            <SheetTitle className="text-lg">Add Container</SheetTitle>
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
            id="create-container-drawer-form"
            onSubmit={(e) => e.preventDefault()}
            className="p-4 pb-24 space-y-4"
          >
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="space-y-2">
                    <Label>Container number</Label>
                    <Input {...register("container_number")} />
                    {errors.container_number && (
                      <p className="text-sm text-destructive">
                        {errors.container_number.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Sequencing priority</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      {...register("sequencing_priority")}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  <div className="space-y-2 min-w-0">
                    <Label className="text-xs sm:text-sm truncate">Size</Label>
                    <Controller
                      name="container_size"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="twenty_feet">20 ft</SelectItem>
                            <SelectItem value="forty_feet">40 ft</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <Label className="text-xs sm:text-sm truncate block">
                      Type
                    </Label>
                    <Controller
                      name="container_type"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dry">Dry</SelectItem>
                            <SelectItem value="reefer">Reefer</SelectItem>
                            <SelectItem value="open_top">Open Top</SelectItem>
                            <SelectItem value="tank">Tank</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <Label className="text-xs sm:text-sm truncate block">
                      Truck type
                    </Label>
                    <Controller
                      name="recommended_truck_type"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? undefined}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="flatbed">Flatbed</SelectItem>
                            <SelectItem value="trailer">Trailer</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="space-y-2">
                    <Label>Gross weight (kg)</Label>
                    <Input
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
                  <div className="space-y-2">
                    <Label>Tare weight (optional)</Label>
                    <Input type="number" min={0} {...register("tare_weight")} />
                    {errors.tare_weight && (
                      <p className="text-sm text-destructive">
                        {errors.tare_weight.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Is returning?</Label>
                  <Select
                    value={isReturning ? "yes" : "no"}
                    onValueChange={(v) => {
                      setValue("is_returning", v === "yes", {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      if (v !== "yes") {
                        setValue(
                          "return_location_info",
                          undefined as unknown as CreateContainerFormValues["return_location_info"],
                          {
                            shouldValidate: true,
                            shouldDirty: true,
                          },
                        );
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Instruction</Label>
                  <p className="text-xs text-muted-foreground">
                    Special handling or notes for transporters
                  </p>
                  <Input
                    placeholder="e.g. Fragile, handle with care..."
                    {...register("container_details.instruction")}
                  />
                  {errors.container_details?.instruction && (
                    <p className="text-sm text-destructive">
                      {errors.container_details.instruction.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Cargo description</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-hide">
                    {commodities.fields.map((field, idx) => (
                      <div key={field.id} className="flex gap-2">
                        <Input
                          placeholder={`Cargo ${idx + 1}`}
                          {...register(
                            `container_details.commodity.${idx}` as const,
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
                    size="sm"
                    onClick={() => commodities.append("")}
                  >
                    Add cargo
                  </Button>
                  {errors.container_details?.commodity && (
                    <p className="text-sm text-destructive">
                      {errors.container_details.commodity.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 3 && isReturning && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="space-y-2 min-w-0">
                    <Label>Country</Label>
                    <Controller
                      name="return_location_info.country"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
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
                        {errors.return_location_info.country.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2 min-w-0">
                    <Label>Address</Label>
                    <Input
                      className="w-full"
                      {...register("return_location_info.address")}
                    />
                    {errors.return_location_info?.address && (
                      <p className="text-sm text-destructive">
                        {errors.return_location_info.address.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input {...register("return_location_info.city")} />
                  {errors.return_location_info?.city && (
                    <p className="text-sm text-destructive">
                      {errors.return_location_info.city.message}
                    </p>
                  )}
                </div>
                {returnCountry === "Djibouti" && (
                  <div className="space-y-2">
                    <Label>Port</Label>
                    <Input {...register("return_location_info.port")} />
                    {errors.return_location_info?.port && (
                      <p className="text-sm text-destructive">
                        {errors.return_location_info.port.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
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
          {(() => {
            const isLastStep = (step === 2 && !isReturning) || step === 3;
            return (
              <Button
                type="button"
                onClick={handleNext}
                disabled={submitting}
                className="flex-1"
              >
                {isLastStep ? (
                  submitting ? (
                    "Creating..."
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Add container
                    </>
                  )
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            );
          })()}
        </div>
      </SheetContent>
    </Sheet>
  );
}
