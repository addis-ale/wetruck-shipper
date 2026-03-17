"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { COUNTRIES } from "@/lib/constants/locations";

import {
  updateContainerSchema,
  UpdateContainerInput,
  Container,
} from "@/lib/zod/container.schema";

import { useUpdateContainer } from "../../../server/hooks/use-update-container";
import { z } from "zod";
import { useTranslation } from "react-i18next";

type UpdateContainerFormValues = z.input<typeof updateContainerSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  container: Container;
};

export function UpdateContainerDialog({
  open,
  onOpenChange,
  container,
}: Props) {
  const { t } = useTranslation(["container", "common"]);

  const form = useForm<UpdateContainerFormValues>({
    resolver: zodResolver(updateContainerSchema),
    defaultValues: {
      container_number: container.container_number,
      container_size: container.container_size,
      container_type: container.container_type,
      gross_weight: container.gross_weight,
      gross_weight_unit: container.gross_weight_unit,
      tare_weight: container.tare_weight,
      sequencing_priority: container.sequencing_priority,
      is_returning: container.is_returning,
      container_details: {
        commodity: container.container_details?.commodity?.length
          ? container.container_details.commodity
          : [""],
        instruction: container.container_details?.instruction ?? "",
      },
      return_location_info: container.return_location_info
        ? {
            country: container.return_location_info.country ?? "",
            city: container.return_location_info.city ?? "",
            address: container.return_location_info.address ?? "",
            port: container.return_location_info.port ?? undefined,
          }
        : undefined,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        container_number: container.container_number,
        container_size: container.container_size,
        container_type: container.container_type,
        gross_weight: container.gross_weight,
        gross_weight_unit: container.gross_weight_unit,
        tare_weight: container.tare_weight,
        sequencing_priority: container.sequencing_priority,
        is_returning: container.is_returning,
        container_details: {
          commodity: container.container_details?.commodity?.length
            ? container.container_details.commodity
            : [""],
          instruction: container.container_details?.instruction ?? "",
        },
        return_location_info: container.return_location_info
          ? {
              country: container.return_location_info.country ?? "",
              city: container.return_location_info.city ?? "",
              address: container.return_location_info.address ?? "",
              port: container.return_location_info.port ?? undefined,
            }
          : undefined,
      });
    }
  }, [container, open, form]);

  const { mutate, isPending, isSuccess } = useUpdateContainer();

  useEffect(() => {
    if (isSuccess) {
      onOpenChange(false);
      form.reset();
    }
  }, [isSuccess, onOpenChange, form]);

  const countryOptions = COUNTRIES.map((c) => ({
    value: c.name,
    label: c.name,
  }));

  const onSubmit = (values: UpdateContainerFormValues) => {
    const parsed = updateContainerSchema.parse(values);

    const payload: UpdateContainerInput = {
      ...parsed,

      container_details: parsed.container_details
        ? {
            ...parsed.container_details,
            commodity: parsed.container_details.commodity.filter(Boolean),
            instruction: parsed.container_details.instruction ?? "",
          }
        : undefined,

      return_location_info: parsed.is_returning
        ? parsed.return_location_info
        : undefined,
    };

    mutate({ id: container.id, data: payload });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("container:update.title")}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="space-y-1">
            <Label>{t("container:create.container_number")} *</Label>
            <Input {...form.register("container_number")} />
          </div>

          <div className="space-y-1">
            <Label>{t("container:create.size")} *</Label>
            <Controller
              control={form.control}
              name="container_size"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
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

          <div className="space-y-1">
            <Label>{t("common:labels.type")} *</Label>
            <Controller
              control={form.control}
              name="container_type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
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

          <div className="space-y-1">
            <Label>{t("container:create.gross_weight_label")} *</Label>
            <Input
              type="number"
              {...form.register("gross_weight", { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-1">
            <Label>{t("container:create.gross_weight_unit_label")} *</Label>
            <Controller
              control={form.control}
              name="gross_weight_unit"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">KG</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1">
            <Label>{t("container:create.tare_weight_label")} *</Label>
            <Input
              type="number"
              {...form.register("tare_weight", { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-1">
            <Label>{t("container:create.sequencing_priority")} *</Label>
            <Input
              type="number"
              {...form.register("sequencing_priority", { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2 col-span-full">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {t("container:update.is_returning_label")}
              </Label>
              <Controller
                control={form.control}
                name="is_returning"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>

          <div className="col-span-full space-y-1">
            <Label>{t("container:update.commodity_label")} *</Label>
            <Input
              placeholder={t("container:update.commodity_placeholder")}
              {...form.register("container_details.commodity.0")}
            />
          </div>

          <div className="col-span-full space-y-1">
            <Label>{t("container:create.instruction")}</Label>
            <Input
              {...form.register("container_details.instruction")}
              placeholder={t("container:update.instruction_placeholder")}
            />
          </div>

          {form.watch("is_returning") && (
            <div className="col-span-full">
              <Label className="text-base font-semibold mb-3 block">
                {t("container:update.return_details")}
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="space-y-1">
                  <Label>{t("common:labels.country")} *</Label>
                  <Controller
                    name="return_location_info.country"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={t("common:select_country")}
                          />
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
                  {form.formState.errors.return_location_info?.country && (
                    <p className="text-sm text-destructive">
                      {
                        form.formState.errors.return_location_info.country
                          .message
                      }
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>{t("common:labels.city")} *</Label>
                  <Input {...form.register("return_location_info.city")} />
                </div>
                <div className="space-y-1">
                  <Label>{t("common:labels.port")} *</Label>
                  <Input {...form.register("return_location_info.port")} />
                </div>
                <div className="space-y-1">
                  <Label>{t("common:labels.address")} *</Label>
                  <Input {...form.register("return_location_info.address")} />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="col-span-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common:buttons.cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? t("container:update.saving")
                : t("container:update.save_changes")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
