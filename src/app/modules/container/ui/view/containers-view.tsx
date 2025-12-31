"use client";

import { ContainerFilters } from "../components/container-filters";
import { ContainerSummary } from "../components/container-summary";
import { ContainerTable } from "../components/container-table";
import { CreateContainerDialog } from "../components/dialogs/create-container-dialog";

export function ContainersView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <ContainerFilters />
        <CreateContainerDialog />
      </div>

      <ContainerSummary />
      <ContainerTable />
    </div>
  );
}
