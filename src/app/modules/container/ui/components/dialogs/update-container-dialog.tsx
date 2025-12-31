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

import {
  updateContainerSchema,
  UpdateContainerInput,
  Container,
} from "@/lib/zod/container.schema";

import { useUpdateContainer } from "../../../server/hooks/use-update-container";

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
  const form = useForm<UpdateContainerInput>({
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
      return_location_info: container.return_location_info ?? {
        country: "",
        city: "",
        port: "",
        address: "",
      },
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
        return_location_info: container.return_location_info ?? {
          country: "",
          city: "",
          port: "",
          address: "",
        },
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

  const onSubmit = (values: UpdateContainerInput) => {
    const payload = {
      ...values,
      container_details: {
        ...values.container_details,
        commodity:
          values.container_details.commodity.length > 0
            ? values.container_details.commodity.filter(Boolean)
            : [""],
      },
      return_location_info: values.is_returning
        ? values.return_location_info
        : undefined,
    };

    mutate({ id: container.id, data: payload });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Container</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Container Number */}
          <div className="space-y-1">
            <Label>Container Number *</Label>
            <Input {...form.register("container_number")} />
          </div>

          {/* Size */}
          <div className="space-y-1">
            <Label>Size *</Label>
            <Controller
              control={form.control}
              name="container_size"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twenty_feet">20 Feet</SelectItem>
                    <SelectItem value="forty_feet">40 Feet</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Type */}
          <div className="space-y-1">
            <Label>Type *</Label>
            <Controller
              control={form.control}
              name="container_type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dry">Dry</SelectItem>
                    <SelectItem value="reefer">Reefer</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Gross Weight */}
          <div className="space-y-1">
            <Label>Gross Weight *</Label>
            <Input
              type="number"
              {...form.register("gross_weight", { valueAsNumber: true })}
            />
          </div>

          {/* Gross Weight Unit */}
          <div className="space-y-1">
            <Label>Gross Weight Unit *</Label>
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
                    <SelectItem value="ton">Ton</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Tare Weight */}
          <div className="space-y-1">
            <Label>Tare Weight *</Label>
            <Input
              type="number"
              {...form.register("tare_weight", { valueAsNumber: true })}
            />
          </div>

          {/* Sequencing Priority */}
          <div className="space-y-1">
            <Label>Sequencing Priority *</Label>
            <Input
              type="number"
              {...form.register("sequencing_priority", { valueAsNumber: true })}
            />
          </div>

          {/* Is Returning */}
          <div className="space-y-2 col-span-full">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Is Returning Container
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

          {/* Commodity */}
          <div className="col-span-full space-y-1">
            <Label>Commodity * (comma separated)</Label>
            <Input
              placeholder="Electronics, Machinery, Textiles"
              {...form.register("container_details.commodity.0")}
            />
          </div>

          {/* Instruction */}
          <div className="col-span-full space-y-1">
            <Label>Instruction</Label>
            <Input
              {...form.register("container_details.instruction")}
              placeholder="Special handling instructions"
            />
          </div>

          {/* Return Location Info - Conditional */}
          {form.watch("is_returning") && (
            <div className="col-span-full">
              <Label className="text-base font-semibold mb-3 block">
                Return Location Details
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="space-y-1">
                  <Label>Country *</Label>
                  <Input
                    {...form.register("return_location_info.country")}
                  />
                </div>
                <div className="space-y-1">
                  <Label>City *</Label>
                  <Input {...form.register("return_location_info.city")} />
                </div>
                <div className="space-y-1">
                  <Label>Port *</Label>
                  <Input {...form.register("return_location_info.port")} />
                </div>
                <div className="space-y-1">
                  <Label>Address *</Label>
                  <Input
                    {...form.register("return_location_info.address")}
                  />
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
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}