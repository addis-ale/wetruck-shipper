"use client";

import { useContainers } from "../../server/hooks/use-container";
import { ContainerDetailsCard } from "../components/container-details-card";
import { ContainerReturnInfo } from "../components/container-return-info";
import { useTranslation } from "react-i18next";

export function ContainerDetailsView({
  containerId,
}: {
  containerId: number;
}) {
  const { t } = useTranslation(["container", "common"]);
  const { data, isLoading } = useContainers(containerId);

  if (isLoading) return <div>{t("common:buttons.loading")}</div>;

  if (!data) return null;

  return (
    <div className="space-y-6">
      <ContainerDetailsCard container={data} />
      <ContainerReturnInfo container={data} />
    </div>
  );
}
