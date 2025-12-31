import { Container } from "../../server/types/container.types";
import { Badge } from "@/components/ui/badge";
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
                Container
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
        <Section title="Specifications" icon={<Ruler className="h-4 w-4" />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoCard
              label="Container Size"
              value={container.container_size.replace("_", " ")}
            />
            <InfoCard
              label="Container Type"
              value={container.container_type}
            />
            <InfoCard
              label="Sequencing Priority"
              value={container.sequencing_priority}
              icon={<AlertCircle className="h-4 w-4" />}
            />
          </div>
        </Section>

        {/* Weight */}
        <Section title="Weight Details" icon={<Scale className="h-4 w-4" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard
              label="Gross Weight"
              value={container.gross_weight}
              unit={container.gross_weight_unit}
            />
            <MetricCard
              label="Tare Weight"
              value={container.tare_weight}
              unit={container.gross_weight_unit}
            />
          </div>
        </Section>

        {/* Cargo */}
        {(details?.commodity?.length || details?.instruction) && (
          <Section title="Cargo Information" icon={<Package className="h-4 w-4" />}>
            <div className="space-y-4">
              {details?.commodity?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Commodity
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
                  label="Handling Instructions"
                  value={details.instruction}
                  icon={<InfoIcon className="h-4 w-4" />}
                />
              )}
            </div>
          </Section>
        )}

        {/* Return Location */}
        {container.is_returning && returnInfo && (
          <Section title="Return Location" icon={<MapPin className="h-4 w-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoCard label="Country" value={returnInfo.country} />
              <InfoCard label="City" value={returnInfo.city} />
              <InfoCard label="Port" value={returnInfo.port} />
            </div>

            {returnInfo.address && (
              <div className="pt-4">
                <InfoCard label="Address" value={returnInfo.address} />
              </div>
            )}
          </Section>
        )}

        {/* Recommendations */}
        {(container.recommended_truck_type ||
          container.recommended_axle_type) && (
          <Section title="System Recommendations" icon={<Truck className="h-4 w-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard
                label="Recommended Truck Type"
                value={container.recommended_truck_type ?? "—"}
              />
              <InfoCard
                label="Recommended Axle Type"
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
        {icon && (
          <span className="text-muted-foreground">
            {icon}
          </span>
        )}
        <h3 className="font-medium">
          {title}
        </h3>
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
          {value !== null && value !== undefined && value !== ""
            ? value
            : "—"}
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
      <p className="text-xs text-muted-foreground">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold">
          {value}
        </span>
        {unit && (
          <span className="text-sm text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
