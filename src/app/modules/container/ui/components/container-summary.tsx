"use client";

import { useContainers } from "../../server/hooks/use-containers";
import { useContainersFilters } from "../../server/hooks/use-containers-filters";

export function ContainerSummary() {
  const { filters } = useContainersFilters();
  const { data } = useContainers(filters);

  return (
    <div className="text-sm text-muted-foreground">
      Total Containers: {data?.total ?? 0}
    </div>
  );
}
