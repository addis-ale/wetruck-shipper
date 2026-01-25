"use client";

import { useContainers } from "../../server/hooks/use-containers";
import { UseContainersParams } from "../../server/hooks/use-containers";
import { containerColumns } from "../columns/container-columns";
import { DataTable } from "./data-table";

type Props = {
  filters: UseContainersParams;
};

export function ContainerTable({ filters }: Props) {
  const { data, isLoading, error } = useContainers(filters);

  if (error) {
    console.error("Container table error:", error);
    return <div>Error loading containers: {error.message}</div>;
  }

  // Debug: Log data in development
  if (process.env.NODE_ENV === "development") {
    console.log("📦 Container Table Data:", data);
    console.log("📦 Container Items:", data?.items);
  }

  return (
    <DataTable
      columns={containerColumns}
      data={data?.items ?? []}
      isLoading={isLoading}
    />
  );
}
