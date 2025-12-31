"use client";

import { useContainers } from "../../server/hooks/use-containers";
import { useContainersFilters } from "../../server/hooks/use-containers-filters";
import { containerColumns } from "../columns/container-columns";
import { DataTable } from "./data-table";

export function ContainerTable() {
  const { filters } = useContainersFilters();
  const { data, isLoading } = useContainers(filters);

  if (isLoading) return <div>Loading containers...</div>;

  return (
    <DataTable
      columns={containerColumns}
      data={data?.items ?? []}
    />
  );
}
