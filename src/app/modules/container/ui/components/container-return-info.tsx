"use client";

import { Container } from "../../server/types/container.types";
import { useTranslation } from "react-i18next";

export function ContainerReturnInfo({ container }: { container: Container }) {
  const { t } = useTranslation("container");

  if (!container.is_returning || !container.return_location_info) return null;

  const info = container.return_location_info;

  return (
    <div className="text-sm">
      {t("container:return_to", { city: info.city, country: info.country })}
    </div>
  );
}
