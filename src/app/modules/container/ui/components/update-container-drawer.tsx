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
  updateContainerSchema,
  UpdateContainerInput,
} from "@/lib/zod/container.schema";
import { COUNTRIES } from "@/lib/constants/locations";
import { useUpdateContainer } from "../../server/hooks/use-update-container";
import type { Container } from "../../server/types/container.types";
import { toast } from "sonner";
import { Box, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { ZodError } from "zod";
import { useTranslation } from "react-i18next";

type UpdateContainerFormValues = z.input<typeof updateContainerSchema> & {
  container_number: string;
  container_size: "twenty_feet" | "forty_feet";
  container_type: string;
  gross_weight: number;
  gross_weight_unit: string;
  container_details: { commodity: string[]; instruction: string };
  return_location_info?: {
    country: string;
    city: string;
    port?: string;
    address: string;
  };
  sequencing_priority?: number;
  is_returning: boolean;
  recommended_truck_type?: string;
};

const STEP_IDS = [1, 2, 3] as const;
const STEP_KEYS = [
  "container:create.steps.basic_info",
  "container:create.steps.details_cargo",
  "container:create.steps.return_location",
] as const;

export interface UpdateContainerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  container: Container;
}

export function UpdateContainerDrawer({
  open,
  onOpenChange,
  container,
}: UpdateContainerDrawerProps) {
  const { t } = useTranslation(["container", "common"]);
  const [step, setStep] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);

  const defaultValues = useMemo<UpdateContainerFormValues>(
    () => ({
      container_number: container.container_number ?? "",
      container_size: container.container_size ?? "twenty_feet",
      container_type: container.container_type ?? "dry",
      gross_weight: container.gross_weight ?? 1,
      gross_weight_unit: container.gross_weight_unit ?? "kg",
      tare_weight: container.tare_weight ?? undefined,
      container_details: {
        commodity:
          container.container_details?.commodity?.length &&
          Array.isArray(container.container_details.commodity)
            ? container.container_details.commodity
            : [""],
        instruction: container.container_details?.instruction ?? "",
      },
      return_location_info: container.return_location_info
        ? {
            country: container.return_location_info.country ?? "",
            city: container.return_location_info.city ?? "",
            port: container.return_location_info.port ?? "",
            address: container.return_location_info.address ?? "",
          }
        : undefined,
      sequencing_priority: container.sequencing_priority ?? 1,
      is_returning: container.is_returning ?? true,
      recommended_truck_type: container.recommended_truck_type ?? "flatbed",
    }),
    [container],
  );

  const form = useForm<UpdateContainerFormValues>({
    resolver: zodResolver(
      updateContainerSchema,
    ) as import("react-hook-form").Resolver<UpdateContainerFormValues>,
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
    name: "container_details.commodity" as FieldArrayPath<UpdateContainerFormValues>,
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
    if (open) {
      setStep(1);
      reset(defaultValues);
      setFormError(null);
    }
  }, [open, container.id, reset, defaultValues]);

  const countryOptions = COUNTRIES.filter(
    (c) => c.name === "Djibouti" || c.name === "Ethiopia",
  ).map((c) => ({ value: c.name, label: c.name }));

  const { mutateAsync, isPending } = useUpdateContainer();

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

  const handleNext = async () => {
    setFormError(null);
    clearErrors();

    if (step === 1) {
      const values = getValues();
      if (!values.container_number?.trim()) {
        setError("container_number", {
          type: "required",
          message: t("common:labels.required"),
        });
        return;
      }
      if (!values.gross_weight || Number(values.gross_weight) <= 0) {
        setError("gross_weight", {
          type: "required",
          message: t("common:labels.required"),
        });
        return;
      }
      const ok = await trigger(
        step1Fields as unknown as Path<UpdateContainerFormValues>[],
      );
      if (ok) setStep(2);
    } else if (step === 2) {
      const values = getValues();
      const inst = values.container_details?.instruction?.trim();
      if (!inst) {
        setError("container_details.instruction", {
          type: "required",
          message: t("common:labels.required"),
        });
        return;
      }
      const comm = values.container_details?.commodity
        ?.map((c) => (typeof c === "string" ? c.trim() : ""))
        .filter(Boolean);
      if (!comm?.length) {
        setError("container_details.commodity", {
          type: "required",
          message: t("container:create.at_least_one_cargo"),
        });
        return;
      }
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
            message: t("common:labels.required"),
          });
        if (!r?.city?.trim())
          setError("return_location_info.city", {
            type: "required",
            message: t("common:labels.required"),
          });
        if (!r?.address?.trim())
          setError("return_location_info.address", {
            type: "required",
            message: t("common:labels.required"),
          });
        return;
      }
      if (returnCountry === "Djibouti" && !r?.port?.trim()) {
        setError("return_location_info.port", {
          type: "required",
          message: t("container:create.port_required"),
        });
        return;
      }
      await onSubmit(getValues());
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  async function onSubmit(values: UpdateContainerFormValues) {
    setFormError(null);
    clearErrors();
    try {
      const parsed = updateContainerSchema.parse(values);
      let returnLocationInfo: UpdateContainerInput["return_location_info"] =
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
      const commodityArray =
        parsed.container_details?.commodity
          ?.map((c) => (typeof c === "string" ? c.trim() : ""))
          .filter(Boolean) ?? [];
      const instruction = parsed.container_details?.instruction?.trim() ?? "";
      const payload: UpdateContainerInput = {
        ...parsed,
        container_details:
          parsed.container_details &&
          commodityArray.length > 0 &&
          instruction.length > 0
            ? {
                commodity: commodityArray,
                instruction,
              }
            : undefined,
        return_location_info: returnLocationInfo,
      };
      await mutateAsync({ id: container.id, data: payload });
      toast.success(t("container:update.success"));
      onOpenChange(false);
      reset(defaultValues);
      setStep(1);
    } catch (err) {
      if (err instanceof ZodError) {
        const first = err.issues[0];
        setFormError(first?.message ?? t("container:update.check_inputs"));
        return;
      }
      const message =
        err instanceof Error && err.message
          ? err.message
          : t("container:update.error");
      setFormError(message);
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
            <SheetTitle className="text-lg">
              {t("container:update.title")}
            </SheetTitle>
          </div>
          <div className="flex gap-1 mt-2">
            {STEP_IDS.map((id) => (
              <div
                key={id}
                className={`h-1 flex-1 rounded-full ${
                  id <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t("container:create.step_of", {
              step,
              title: t(STEP_KEYS[step - 1]),
            })}
          </p>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <form
            id="update-container-drawer-form"
            onSubmit={(e) => e.preventDefault()}
            className="p-4 pb-24 space-y-4"
          >
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>{t("container:create.container_number")}</Label>
                    <Input {...register("container_number")} />
                    {errors.container_number && (
                      <p className="text-sm text-destructive">
                        {errors.container_number.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>{t("container:create.sequencing_priority")}</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      {...register("sequencing_priority")}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2 min-w-0">
                    <Label>{t("container:create.size")}</Label>
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
                  </div>
                  <div className="space-y-2 min-w-0">
                    <Label>{t("container:create.container_type")}</Label>
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
                  </div>
                  <div className="space-y-2 min-w-0">
                    <Label>{t("container:create.truck_type")}</Label>
                    <Controller
                      name="recommended_truck_type"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? undefined}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t("common:select")} />
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
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>{t("container:create.gross_weight")}</Label>
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
                    <Label>{t("container:create.tare_weight")}</Label>
                    <Input type="number" min={0} {...register("tare_weight")} />
                    {errors.tare_weight && (
                      <p className="text-sm text-destructive">
                        {errors.tare_weight.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("container:create.is_returning")}</Label>
                  <Select
                    value={isReturning ? "yes" : "no"}
                    onValueChange={(v) => {
                      setValue("is_returning", v === "yes", {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      if (v === "yes") {
                        setValue(
                          "return_location_info",
                          getValues("return_location_info") ?? {
                            country: "",
                            city: "",
                            port: "",
                            address: "",
                          },
                          { shouldValidate: true, shouldDirty: true },
                        );
                      } else {
                        setValue(
                          "return_location_info",
                          undefined as unknown as UpdateContainerFormValues["return_location_info"],
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
                      <SelectItem value="yes">{t("common:yes")}</SelectItem>
                      <SelectItem value="no">{t("common:no")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("container:create.instruction")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("container:create.instruction_hint")}
                  </p>
                  <Input
                    placeholder={t("container:create.instruction_placeholder")}
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
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-hide">
                    {commodities.fields.map((field, idx) => (
                      <div key={field.id} className="flex gap-2">
                        <Input
                          placeholder={t("container:create.cargo_n", {
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
                    size="sm"
                    onClick={() => commodities.append("")}
                  >
                    {t("container:create.add_cargo")}
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2 min-w-0">
                    <Label>{t("common:labels.country")}</Label>
                    <Controller
                      name="return_location_info.country"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
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
                  <div className="space-y-2 min-w-0">
                    <Label>{t("common:labels.address")}</Label>
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
                  <Label>{t("common:labels.city")}</Label>
                  <Input {...register("return_location_info.city")} />
                  {errors.return_location_info?.city && (
                    <p className="text-sm text-destructive">
                      {errors.return_location_info.city.message}
                    </p>
                  )}
                </div>
                {returnCountry === "Djibouti" && (
                  <div className="space-y-2">
                    <Label>{t("common:labels.port")}</Label>
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
              {t("common:buttons.back")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="flex-1"
            >
              {t("common:buttons.cancel")}
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
                    t("container:update.saving")
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      {t("container:update.save_changes")}
                    </>
                  )
                ) : (
                  <>
                    {t("common:buttons.next")}
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
