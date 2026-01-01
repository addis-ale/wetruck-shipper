"use client";

import { Input } from "@/components/ui/input";
import { UseContainersParams } from "../../server/hooks/use-containers";

type Props = {
  filters: UseContainersParams;
  setFilters: (next: Partial<UseContainersParams>) => void;
};

export function ContainerFilters({ filters, setFilters }: Props) {
  return (
    <Input
      placeholder="Search container number"
      value={filters.container_number ?? ""}
      onChange={(e) =>
        setFilters({
          container_number: e.target.value || undefined,
        })
      }
      className="w-64"
    />
  );
}
