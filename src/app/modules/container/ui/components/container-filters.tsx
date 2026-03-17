"use client";

import { Input } from "@/components/ui/input";
import { UseContainersParams } from "../../server/hooks/use-containers";
import { useTranslation } from "react-i18next";

type Props = {
  filters: UseContainersParams;
  setFilters: (next: Partial<UseContainersParams>) => void;
};

export function ContainerFilters({ filters, setFilters }: Props) {
  const { t } = useTranslation("container");

  return (
    <Input
      placeholder={t("container:search_placeholder")}
      value={filters.container_number ?? ""}
      onChange={(e) =>
        setFilters({
          container_number: e.target.value || undefined,
        })
      }
      className="w-64"
    />
  );
}
