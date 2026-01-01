"use client";

import { ContainerFilters } from "../components/container-filters";
import { ContainerSummary } from "../components/container-summary";
import { ContainerTable } from "../components/container-table";
import { CreateContainerDialog } from "../components/dialogs/create-container-dialog";
import { useContainersFilters } from "../../server/hooks/use-containers-filters";

export function ContainersView() {
  const filtersState = useContainersFilters();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <ContainerFilters {...filtersState} />
        <CreateContainerDialog />
      </div>

      <ContainerSummary {...filtersState} />
      <ContainerTable {...filtersState} />
    </div>
  );
}
