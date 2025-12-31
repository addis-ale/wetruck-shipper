"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";

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
  createContainerSchema,
  CreateContainerInput,
} from "@/lib/zod/container.schema";
import { useCreateContainer } from "../../../server/hooks/use-create-container";

export function CreateContainerDialog() {
  const [open, setOpen] = useState(false);


  const defaultValues = useMemo<CreateContainerInput>(
    () => ({
      container_number: "",
      container_size: "twenty_feet",
      container_type: "dry",
      gross_weight: 0,
      gross_weight_unit: "kg",
      tare_weight: 0,
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
    }),
    []
  );

// form

  const form = useForm<CreateContainerInput>({
    resolver: zodResolver(createContainerSchema),
    defaultValues,
    mode: "onChange",
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting, isValid },
    control,
    setValue,
  } = form;

  const isReturning = watch("is_returning");

  const commodities = useFieldArray({
    control: control as any,
    name: "container_details.commodity",
  });
  
  // mutation
  const { mutate, isPending } = useCreateContainer({
    onSuccess: () => {
      setOpen(false);
      reset(defaultValues);
    },
  });

  const submitting = isPending || isSubmitting;

// submit
  function onSubmit(values: CreateContainerInput) {
    const payload: CreateContainerInput = {
      ...values,
      container_details: {
        ...values.container_details,
        commodity: values.container_details.commodity
          .map((c) => c.trim())
          .filter(Boolean),
      },
      return_location_info: values.is_returning
        ? values.return_location_info
        : undefined,
    };

    mutate(payload);
  }
  // ui
  return (
    <>
      <Button onClick={() => setOpen(true)}>Add Container</Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset(defaultValues);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Container</DialogTitle>
            <DialogDescription>
              Fill the container details and save.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Top fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Container Number</Label>
                <Input {...register("container_number")} />
                {errors.container_number && (
                  <p className="text-sm text-destructive">
                    {errors.container_number.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Sequencing Priority</Label>
                <Input type="number" min={1} {...register("sequencing_priority")} />
                {errors.sequencing_priority && (
                  <p className="text-sm text-destructive">
                    {errors.sequencing_priority.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Container Size</Label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  {...register("container_size")}
                >
                  <option value="twenty_feet">20 Feet</option>
                  <option value="forty_feet">40 Feet</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Container Type</Label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  {...register("container_type")}
                >
                  <option value="dry">Dry</option>
                  <option value="reefer">Reefer</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Gross Weight</Label>
                <Input type="number" min={0} {...register("gross_weight")} />
              </div>

              <div className="space-y-2">
                <Label>Gross Weight Unit</Label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  {...register("gross_weight_unit")}
                >
                  <option value="kg">kg</option>
                  <option value="ton">ton</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Tare Weight</Label>
                <Input type="number" min={0} {...register("tare_weight")} />
              </div>

              <div className="space-y-2">
                <Label>Is Returning?</Label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={isReturning ? "yes" : "no"}
                  onChange={(e) =>
                    setValue("is_returning", e.target.value === "yes", {
                      shouldValidate: true,
                    })
                  }
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>

            {/* Container details */}
            <div className="rounded-md border p-4 space-y-4">
              <div className="font-medium">Container Details</div>

              <div className="space-y-2">
                <Label>Instruction</Label>
                <Input {...register("container_details.instruction")} />
              </div>

              <div className="space-y-2">
                <Label>Commodity</Label>

                {commodities.fields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      placeholder={`Commodity ${idx + 1}`}
                      {...register(`container_details.commodity.${idx}`)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => commodities.remove(idx)}
                      disabled={commodities.fields.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => commodities.append("")}
                >
                  Add Commodity
                </Button>
              </div>
            </div>

            {/* Return location */}
            {isReturning && (
              <div className="rounded-md border p-4 space-y-4">
                <div className="font-medium">Return Location</div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input placeholder="Country" {...register("return_location_info.country")} />
                  <Input placeholder="City" {...register("return_location_info.city")} />
                  <Input placeholder="Port" {...register("return_location_info.port")} />
                  <Input placeholder="Address" {...register("return_location_info.address")} />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !isValid}>
                {submitting ? "Saving..." : "Add Container"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
