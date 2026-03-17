"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { Container } from "../../server/types/container.types";
import { ContainerActions } from "../components/container-actions";

export function useContainerColumns(): ColumnDef<Container>[] {
  const { t } = useTranslation("container");

  return useMemo<ColumnDef<Container>[]>(
    () => [
      {
        accessorKey: "container_number",
        header: t("container:columns.container_no"),
      },
      {
        accessorKey: "container_size",
        header: t("container:columns.size"),
      },
      {
        accessorKey: "container_type",
        header: t("container:columns.type"),
      },
      {
        accessorKey: "status",
        header: t("container:columns.status"),
      },
      {
        id: "actions",
        cell: ({ row }) => <ContainerActions container={row.original} />,
      },
    ],
    [t],
  );
}
