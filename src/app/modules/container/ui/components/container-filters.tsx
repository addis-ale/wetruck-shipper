"use client";

import { Input } from "@/components/ui/input";
import { useContainersFilters } from "../../server/hooks/use-containers-filters";

export function ContainerFilters() {
  const { filters, setFilters } = useContainersFilters();

  return (
    <Input
      placeholder="Search container number"
      value={filters.container_number ?? ""}
      onChange={(e) =>
        setFilters({ container_number: e.target.value })
      }
      className="w-64"
    />
  );
}
