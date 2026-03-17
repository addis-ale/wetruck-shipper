"use client";

import { useMemo, useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, Controller, type Path } from "react-hook-form";
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
import type { Container } from "../../../server/types/container.types";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type CreateContainerFormValues = z.input<typeof createContainerSchema>;

type BackendErrorShape = {
  message?: string;
  detail?: unknown;
  fields?: Record<string, unknown>;
  errors?: unknown;
  response?: {
    data?: BackendErrorShape;
  };
};

interface BackendErrorWithFields {
  fields?: Record<string, unknown>;
  errors?: Record<string, unknown>;
  detail?: Array<{
    loc?: unknown[];
    msg?: string;
    type?: string;
  }>;
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
      const errorItem = item as {
        loc?: unknown[];
        msg?: string;
        type?: string;
      };
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

export interface CreateContainerDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCreated?: (container: Container) => void;
  hideTrigger?: boolean;
}

export function CreateContainerDialog(props?: CreateContainerDialogProps) {
  const {
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    onCreated,
    hideTrigger = false,
  } = props ?? {};

  const { t } = useTranslation(["container", "common"]);
  const [internalOpen, setInternalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isControlled =
    controlledOpen !== undefined && controlledOnOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange : setInternalOpen;

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
        country: "",
        city: "",
        port: "",
        address: "",
      },

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
    handleSubmit,
    watch,
    reset,
    control,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting, isValid },
  } = form;

  const isReturning = watch("is_returning");
  const returnCountry = watch("return_location_info.country");

  useEffect(() => {
    if (returnCountry && returnCountry !== "Djibouti") {
      setValue("return_location_info.port", undefined, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [returnCountry, setValue]);

  const commodities = useFieldArray({
    control,
    // @ts-expect-error - React Hook Form type inference issue with nested arrays
    name: "container_details.commodity",
  });

  const countryOptions = COUNTRIES.filter(
    (c) => c.name === "Djibouti" || c.name === "Ethiopia",
  ).map((c) => ({
    value: c.name,
    label: c.name,
  }));

  const { mutateAsync, isPending } = useCreateContainer({
    onSuccess: (container) => {
      toast.success(t("container:create.success"));
      setFormError(null);
      setOpen(false);
      reset(defaultValues);
      onCreated?.(container);
    },
  });

  const submitting = isSubmitting || isPending;

  async function onSubmit(values: CreateContainerFormValues) {
    setFormError(null);
    clearErrors();

    try {
      const parsed = createContainerSchema.parse(values);

      let returnLocationInfo = undefined;

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
        extractFormMessage(responseData, t("container:create.error")),
      );
    }
  }

  return (
    <>
      {!hideTrigger && (
        <Button onClick={() => setOpen(true)}>
          {t("container:add_container")}
        </Button>
      )}

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
        <DialogContent className="create-container-dialog sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("container:create.title")}</DialogTitle>
            <DialogDescription>
              {t("container:create.dialog_description")}
            </DialogDescription>
          </DialogHeader>

          <form
            id="create-container-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto pr-1 space-y-6 scrollbar-hide"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="container_number" required>
                  {t("container:create.container_number")}
                </Label>
                <Input
                  id="container_number"
                  {...register("container_number")}
                />
                {errors.container_number && (
                  <p className="text-sm text-destructive">
                    {errors.container_number.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sequencing_priority">
                  {t("container:create.sequencing_priority")}
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

              <div className="space-y-2">
                <Label htmlFor="container_size">
                  {t("container:container_size")}
                </Label>
                <Controller
                  name="container_size"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="container_size">
                        <SelectValue
                          placeholder={t("container:create.select_size")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="twenty_feet">
                          {t("common:container_sizes.20_ft")}
                        </SelectItem>
                        <SelectItem value="forty_feet">
                          {t("common:container_sizes.40_ft")}
                        </SelectItem>
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
                <Label htmlFor="container_type">
                  {t("container:container_type")}
                </Label>
                <Controller
                  name="container_type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="container_type">
                        <SelectValue
                          placeholder={t("container:create.select_type")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dry">
                          {t("common:container_types.dry")}
                        </SelectItem>
                        <SelectItem value="reefer">
                          {t("common:container_types.reefer")}
                        </SelectItem>
                        <SelectItem value="open_top">
                          {t("common:container_types.open_top")}
                        </SelectItem>
                        <SelectItem value="tank">
                          {t("common:container_types.tank")}
                        </SelectItem>
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

              <div className="space-y-2">
                <Label htmlFor="recommended_truck_type">
                  {t("container:recommended_truck_type")}
                </Label>

                <Controller<CreateContainerFormValues, "recommended_truck_type">
                  name="recommended_truck_type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? undefined}
                    >
                      <SelectTrigger
                        className="w-full"
                        id="recommended_truck_type"
                      >
                        <SelectValue
                          placeholder={t("container:create.select_truck_type")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flatbed">
                          {t("common:truck_types.flatbed")}
                        </SelectItem>
                        <SelectItem value="trailer">
                          {t("common:truck_types.trailer")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />

                {errors.recommended_truck_type && (
                  <p className="text-sm text-destructive">
                    {errors.recommended_truck_type.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gross_weight">
                  {t("container:create.gross_weight_label")}
                </Label>
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

              <div className="space-y-2">
                <Label htmlFor="gross_weight_unit">
                  {t("container:create.gross_weight_unit_label")}
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
                        <SelectValue
                          placeholder={t("container:create.select_unit")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
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

              <div className="space-y-2">
                <Label htmlFor="tare_weight">
                  {t("container:create.tare_weight_label")}
                </Label>
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

              <div className="space-y-2">
                <Label htmlFor="is_returning">
                  {t("container:create.is_returning")}
                </Label>
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
                    <SelectValue
                      placeholder={t("container:create.select_option")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">{t("common:yes")}</SelectItem>
                    <SelectItem value="no">{t("common:no")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border p-4 space-y-4">
              <div className="font-medium">
                {t("container:create.container_details_section")}
              </div>

              <div className="space-y-2">
                <div>
                  <Label htmlFor="instruction">
                    {t("container:create.instruction")}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("container:create.instruction_full_hint")}
                  </p>
                </div>
                <Input
                  id="instruction"
                  placeholder={t("container:create.instruction_example")}
                  {...register("container_details.instruction")}
                />
                {errors.container_details?.instruction && (
                  <p className="text-sm text-destructive">
                    {errors.container_details.instruction.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t("container:create.cargo_description")}</Label>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                  {commodities.fields.map((field, idx) => (
                    <div key={field.id} className="flex gap-2">
                      <Input
                        placeholder={t("container:create.cargo_description_n", {
                          n: idx + 1,
                        })}
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
                        {t("container:create.remove")}
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => commodities.append("")}
                >
                  {t("container:create.add_cargo_description")}
                </Button>

                {errors.container_details?.commodity && (
                  <p className="text-sm text-destructive">
                    {errors.container_details.commodity.message}
                  </p>
                )}
              </div>
            </div>

            {isReturning && (
              <div className="rounded-md border p-4 space-y-4">
                <div className="font-medium">
                  {t("container:create.return_location_section")}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="country">
                      {t("common:labels.country")}
                    </Label>
                    <Controller
                      name="return_location_info.country"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger id="country">
                            <SelectValue
                              placeholder={t("common:select_country")}
                            />
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

                  <div className="space-y-2">
                    <Label htmlFor="city">{t("common:labels.city")}</Label>
                    <Input
                      id="city"
                      {...register("return_location_info.city")}
                    />
                    {errors.return_location_info?.city && (
                      <p className="text-sm text-destructive">
                        {errors.return_location_info.city.message}
                      </p>
                    )}
                  </div>
                  {returnCountry === "Djibouti" && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="port"
                        required={returnCountry === "Djibouti"}
                      >
                        {t("common:labels.port")}
                      </Label>
                      <Input
                        id="port"
                        {...register("return_location_info.port")}
                        required={returnCountry === "Djibouti"}
                      />
                      {errors.return_location_info?.port && (
                        <p className="text-sm text-destructive">
                          {errors.return_location_info.port.message}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="address">
                      {t("common:labels.address")}
                    </Label>
                    <Input
                      id="address"
                      {...register("return_location_info.address")}
                    />
                    {errors.return_location_info?.address && (
                      <p className="text-sm text-destructive">
                        {errors.return_location_info.address.message}
                      </p>
                    )}
                  </div>
                </div>

                {errors.return_location_info &&
                  typeof errors.return_location_info.message === "string" && (
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
              {t("common:buttons.cancel")}
            </Button>
            <Button
              type="submit"
              form="create-container-form"
              disabled={submitting || !isValid}
            >
              {submitting
                ? t("container:create.creating")
                : t("container:create.add_container")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
