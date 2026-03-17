"use client";

import { useContainers } from "../../server/hooks/use-containers";
import { UseContainersParams } from "../../server/hooks/use-containers";
import { useTranslation } from "react-i18next";

type Props = {
  filters: UseContainersParams;
};

export function ContainerSummary({ filters }: Props) {
  const { t } = useTranslation("container");
  const { data } = useContainers(filters);

  return (
    <div className="text-sm text-muted-foreground">
      {t("container:total")}: {data?.total ?? 0}
    </div>
  );
}
