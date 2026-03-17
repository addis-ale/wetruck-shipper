"use client";

import { useMemo, useEffect } from "react";
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
  originDestinationEnum,
} from "@/lib/zod/shipment.schema";
import { useCreateShipment } from "@/app/modules/shipment/server/hooks/use-create-shipment";
import { Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  COUNTRIES,
  getRegionsByCountryCode,
  type Region,
} from "@/lib/constants/locations";

type CreateShipmentFormValues = z.input<typeof createShipmentSchema>;

interface CreateShipmentFormProps {
  onSuccess?: (shipmentId: string) => void;
}

const formatLocation = (location: string) => {
  return location
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function CreateShipmentForm({ onSuccess }: CreateShipmentFormProps) {
  const { t } = useTranslation(["shipment", "common"]);
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

  // Auto-set region to "Djibouti" when Djibouti country is selected
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

  const { mutate, isPending } = useCreateShipment({
    onSuccess: (shipmentId) => {
      reset(defaultValues);
      onSuccess?.(shipmentId.toString());
    },
  });

  const submitting = isPending || isSubmitting;

  function onSubmit(values: CreateShipmentFormValues) {
    const parsed = createShipmentSchema.parse({
      ...values,
      pickup_date: new Date(values.pickup_date).toISOString(),
      delivery_date: new Date(values.delivery_date).toISOString(),
    });

    mutate(parsed);
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <CardTitle>{t("shipment:create_form.title")}</CardTitle>
        </div>
        <CardDescription>
          {t("shipment:create_form.subtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info and Shipment Details in one row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="origin">{t("shipment:create_form.origin")}</Label>
              <Controller
                name="origin"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value as string}>
                    <SelectTrigger id="origin" className="w-full">
                      <SelectValue placeholder={t("shipment:create_form.select_origin")} />
                    </SelectTrigger>
                    <SelectContent>
                      {originDestinationEnum.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {formatLocation(option)}
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
              <Label htmlFor="destination">{t("shipment:create_form.destination")}</Label>
              <Controller
                name="destination"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value as string}>
                    <SelectTrigger id="destination" className="w-full">
                      <SelectValue placeholder={t("shipment:create_form.select_destination")} />
                    </SelectTrigger>
                    <SelectContent>
                      {originDestinationEnum.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {formatLocation(option)}
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

            <div className="space-y-2">
              <Label htmlFor="pickup_date">{t("shipment:create_form.pickup_date")}</Label>
              <Input
                id="pickup_date"
                type="date"
                {...register("pickup_date")}
              />
              {errors.pickup_date && (
                <p className="text-sm text-destructive">
                  {errors.pickup_date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_date">{t("shipment:create_form.delivery_date")}</Label>
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

            <div className="space-y-2">
              <Label htmlFor="bill_of_lading_number">
                {t("shipment:create_form.bill_of_lading")}
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
          </div>

          <Separator />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Pickup Facility */}
            <div className="rounded-md border p-4 space-y-4">
              <h3 className="text-sm font-semibold">{t("shipment:create_form.pickup_address")}</h3>
              <div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pickup_country">{t("common:labels.country")}</Label>
                    <Controller
                      name="pickup_facility.country"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Auto-set region for Djibouti, otherwise reset
                            if (value === "dj") {
                              const djiboutiRegions =
                                getRegionsByCountryCode("dj");
                              if (djiboutiRegions.length > 0) {
                                setValue(
                                  "pickup_facility.region",
                                  djiboutiRegions[0].code,
                                );
                              }
                            } else {
                              setValue("pickup_facility.region", "");
                            }
                          }}
                          value={field.value}
                        >
                          <SelectTrigger id="pickup_country" className="w-full">
                            <SelectValue placeholder={t("common:labels.select_country")} />
                          </SelectTrigger>
                          <SelectContent>
                            {countryOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
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
                    <Label htmlFor="pickup_region">{t("common:labels.region")}</Label>
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
                            pickupCountry
                              ? t("common:labels.select_region")
                              : t("common:labels.select_country_first")
                          }
                          searchPlaceholder={t("common:labels.search_region")}
                          emptyMessage={t("common:labels.no_region_found")}
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

                  <div className="space-y-2">
                    <Label htmlFor="pickup_name">{t("common:labels.clearance_agent_name")}</Label>
                    <Input
                      id="pickup_name"
                      placeholder={t("common:labels.clearance_agent_name")}
                      {...register("pickup_facility.name")}
                    />
                    {errors.pickup_facility?.name && (
                      <p className="text-sm text-destructive">
                        {errors.pickup_facility.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pickup_address">{t("common:labels.loading_address")}</Label>
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
                    <Label htmlFor="pickup_contact_name">{t("common:labels.contact_name")}</Label>
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
                    <Label htmlFor="pickup_contact_phone">{t("common:labels.contact_phone")}</Label>
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
                    <Label htmlFor="pickup_contact_email">{t("common:labels.contact_email")}</Label>
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
              <h3 className="text-sm font-semibold">{t("shipment:create_form.delivery_address")}</h3>
              <div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="delivery_country">{t("common:labels.country")}</Label>
                    <Controller
                      name="delivery_facility.country"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Auto-set region for Djibouti, otherwise reset
                            if (value === "dj") {
                              const djiboutiRegions =
                                getRegionsByCountryCode("dj");
                              if (djiboutiRegions.length > 0) {
                                setValue(
                                  "delivery_facility.region",
                                  djiboutiRegions[0].code,
                                );
                              }
                            } else {
                              setValue("delivery_facility.region", "");
                            }
                          }}
                          value={field.value}
                        >
                          <SelectTrigger
                            id="delivery_country"
                            className="w-full"
                          >
                            <SelectValue placeholder={t("common:labels.select_country")} />
                          </SelectTrigger>
                          <SelectContent>
                            {countryOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
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
                    <Label htmlFor="delivery_region">{t("common:labels.region")}</Label>
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
                            deliveryCountry
                              ? t("common:labels.select_region")
                              : t("common:labels.select_country_first")
                          }
                          searchPlaceholder={t("common:labels.search_region")}
                          emptyMessage={t("common:labels.no_region_found")}
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

                  <div className="space-y-2">
                    <Label htmlFor="delivery_name">{t("common:labels.clearance_agent_name")}</Label>
                    <Input
                      id="delivery_name"
                      placeholder={t("common:labels.clearance_agent_name")}
                      {...register("delivery_facility.name")}
                    />
                    {errors.delivery_facility?.name && (
                      <p className="text-sm text-destructive">
                        {errors.delivery_facility.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery_address">
                      {t("common:labels.off_loading_address")}
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
                    <Label htmlFor="delivery_contact_name">{t("common:labels.contact_name")}</Label>
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
                    <Label htmlFor="delivery_contact_phone">
                      {t("common:labels.contact_phone")}
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
                    <Label htmlFor="delivery_contact_email">
                      {t("common:labels.contact_email")}
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

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => reset(defaultValues)}
              disabled={submitting}
            >
              {t("common:buttons.reset")}
            </Button>
            <Button type="submit" disabled={submitting || !isValid}>
              {submitting ? t("common:buttons.creating") : t("shipment:create_form.create_shipment")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
