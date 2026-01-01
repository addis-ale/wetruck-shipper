"use client";

import { useContainers } from "../../server/hooks/use-containers";
import { UseContainersParams } from "../../server/hooks/use-containers";
import { containerColumns } from "../columns/container-columns";
import { DataTable } from "./data-table";

type Props = {
  filters: UseContainersParams;
};

export function ContainerTable({ filters }: Props) {
  const { data, isLoading } = useContainers(filters);

  if (isLoading) return <div>Loading containers...</div>;

  return (
    <DataTable
      columns={containerColumns}
      data={data?.items ?? []}
    />
  );
}
