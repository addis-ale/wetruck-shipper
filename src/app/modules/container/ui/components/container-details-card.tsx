import { Container } from "../../server/types/container.types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Scale,
  MapPin,
  Truck,
  Info as InfoIcon,
} from "lucide-react";

export function ContainerDetailsCard({ container }: { container: Container }) {
  const details = container.container_details;
  const returnInfo = container.return_location_info;

  return (
    <div className="rounded-2xl border bg-card shadow-md">
      {/* ===== Header ===== */}
      <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Package className="h-4 w-4" />
            Container
          </p>
          <h1 className="text-xl font-semibold tracking-tight">
            {container.container_number}
          </h1>
        </div>

        <Badge className="capitalize px-3 py-1 text-sm" variant="outline">
          {container.status}
        </Badge>
      </div>

      <Separator />

      {/* ===== Core Info ===== */}
      <Section title="Specifications" icon={<InfoIcon className="h-4 w-4" />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Info label="Size" value={container.container_size.replace("_", " ")} />
          <Info label="Type" value={container.container_type} />
          <Info label="Priority" value={container.sequencing_priority} />
        </div>
      </Section>

      {/* ===== Weights ===== */}
      <Section title="Weight Details" icon={<Scale className="h-4 w-4" />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Metric
            label="Gross Weight"
            value={`${container.gross_weight} ${container.gross_weight_unit}`}
          />
          <Metric
            label="Tare Weight"
            value={`${container.tare_weight} ${container.gross_weight_unit}`}
          />
        </div>
      </Section>

      {/* ===== Commodity ===== */}
      {(details?.commodity?.length || details?.instruction) && (
        <Section title="Cargo Information" icon={<Package className="h-4 w-4" />}>
          {details?.commodity?.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Commodity</p>
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
            <Info label="Handling Instructions" value={details.instruction} />
          )}
        </Section>
      )}

      {/* ===== Return Location ===== */}
      {container.is_returning && returnInfo && (
        <Section title="Return Location" icon={<MapPin className="h-4 w-4" />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Info label="Country" value={returnInfo.country} />
            <Info label="City" value={returnInfo.city} />
            <Info label="Port" value={returnInfo.port} />
          </div>

          {returnInfo.address && (
            <Info label="Address" value={returnInfo.address} />
          )}
        </Section>
      )}

      {/* ===== Recommendations ===== */}
      {(container.recommended_truck_type ||
        container.recommended_axle_type) && (
        <Section title="System Recommendations" icon={<Truck className="h-4 w-4" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Info
              label="Truck Type"
              value={container.recommended_truck_type ?? "—"}
            />
            <Info
              label="Axle Type"
              value={container.recommended_axle_type ?? "—"}
            />
          </div>
        </Section>
      )}
    </div>
  );
}

/* ===================== */
/* Reusable UI Pieces   */
/* ===================== */

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
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium capitalize">
        {value !== null && value !== undefined && value !== "" ? value : "—"}
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/40 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
