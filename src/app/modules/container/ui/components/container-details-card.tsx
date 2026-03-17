"use client";

import { Container } from "../../server/types/container.types";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import {
  Package,
  Scale,
  MapPin,
  Truck,
  Info as InfoIcon,
  Ruler,
  AlertCircle,
} from "lucide-react";

/* ===================================================== */

export function ContainerDetailsCard({ container }: { container: Container }) {
  const { t } = useTranslation(["container", "common"]);
  const details = container.container_details;
  const returnInfo = container.return_location_info;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* ===== Header ===== */}
      <div className="border-b p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md border bg-muted">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t("container:container")}
              </p>
              <h1 className="text-xl font-semibold tracking-tight">
                {container.container_number}
              </h1>
            </div>
          </div>

          <Badge variant="outline" className="capitalize">
            {container.status}
          </Badge>
        </div>
      </div>

      {/* ===== Content ===== */}
      <div className="divide-y">
        {/* Specifications */}
        <Section
          title={t("container:specifications")}
          icon={<Ruler className="h-4 w-4" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoCard
              label={t("container:container_size")}
              value={t(`common:container_sizes.${container.container_size}`, {
                defaultValue: container.container_size.replace(/_/g, " "),
              })}
            />
            <InfoCard
              label={t("container:container_type")}
              value={t(`common:container_types.${container.container_type}`, {
                defaultValue: container.container_type.replace(/_/g, " "),
              })}
            />
            <InfoCard
              label={t("container:sequencing_priority")}
              value={container.sequencing_priority}
              icon={<AlertCircle className="h-4 w-4" />}
            />
          </div>
        </Section>

        {/* Weight */}
        <Section
          title={t("container:weight_details")}
          icon={<Scale className="h-4 w-4" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard
              label={t("container:gross_weight")}
              value={container.gross_weight}
              unit={container.gross_weight_unit}
            />
            <MetricCard
              label={t("container:tare_weight")}
              value={container.tare_weight ?? 0}
              unit={container.gross_weight_unit}
            />
          </div>
        </Section>

        {/* Cargo */}
        {((details?.commodity && details.commodity.length > 0) ||
          details?.instruction) && (
          <Section
            title={t("container:cargo_info")}
            icon={<Package className="h-4 w-4" />}
          >
            <div className="space-y-4">
              {details?.commodity && details.commodity.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {t("container:cargo_description")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {details.commodity.map((item: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {details?.instruction && (
                <InfoCard
                  label={t("container:handling_instructions")}
                  value={details.instruction}
                  icon={<InfoIcon className="h-4 w-4" />}
                />
              )}
            </div>
          </Section>
        )}

        {/* Return Location */}
        {container.is_returning && returnInfo && (
          <Section
            title={t("container:return_location")}
            icon={<MapPin className="h-4 w-4" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoCard
                label={t("common:labels.country")}
                value={returnInfo.country}
              />
              <InfoCard
                label={t("common:labels.city")}
                value={returnInfo.city}
              />
              <InfoCard
                label={t("common:labels.port")}
                value={returnInfo.port}
              />
            </div>

            {returnInfo.address && (
              <div className="pt-4">
                <InfoCard
                  label={t("common:labels.address")}
                  value={returnInfo.address}
                />
              </div>
            )}
          </Section>
        )}

        {/* Recommendations */}
        {(container.recommended_truck_type ||
          container.recommended_axle_type) && (
          <Section
            title={t("container:system_recommendations")}
            icon={<Truck className="h-4 w-4" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard
                label={t("container:recommended_truck_type")}
                value={container.recommended_truck_type ?? "—"}
              />
              <InfoCard
                label={t("container:recommended_axle_type")}
                value={container.recommended_axle_type ?? "—"}
              />
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

/* ===================================================== */
/* Reusable Components                                   */
/* ===================================================== */

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <h3 className="font-medium">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function InfoCard({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string | number | null;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <p className="font-medium truncate">
          {value !== null && value !== undefined && value !== "" ? value : "—"}
        </p>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number;
  unit?: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}
