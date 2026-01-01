"use client";

import { useContainers } from "../../server/hooks/use-containers";
import { UseContainersParams } from "../../server/hooks/use-containers";

type Props = {
  filters: UseContainersParams;
};

export function ContainerSummary({ filters }: Props) {
  const { data } = useContainers(filters);

  return (
    <div className="text-sm text-muted-foreground">
      Total Containers: {data?.total ?? 0}
    </div>
  );
}
