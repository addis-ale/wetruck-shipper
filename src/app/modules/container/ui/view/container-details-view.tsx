"use client";

import { useContainer } from "../../server/hooks/use-container";
import { ContainerDetailsCard } from "../components/container-details-card";
import { ContainerReturnInfo } from "../components/container-return-info";

export function ContainerDetailsView({
  containerId,
}: {
  containerId: number;
}) {
  const { data, isLoading } = useContainer(containerId);

  if (isLoading) return <div>Loading...</div>;

  if (!data) return null;

  return (
    <div className="space-y-6">
      <ContainerDetailsCard container={data} />
      <ContainerReturnInfo container={data} />
    </div>
  );
}
