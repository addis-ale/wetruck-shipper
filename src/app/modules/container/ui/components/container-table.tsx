"use client";

import { useContainers } from "../../server/hooks/use-containers";
import { UseContainersParams } from "../../server/hooks/use-containers";
import { useContainerColumns } from "../columns/container-columns";
import { DataTable } from "./data-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

const PER_PAGE_OPTIONS = [10, 20, 50, 100];

type Props = {
  filters: UseContainersParams;
  setPage: (page: number) => void;
  setFilters: (next: Partial<UseContainersParams>) => void;
};

export function ContainerTable({ filters, setPage, setFilters }: Props) {
  const { t } = useTranslation(["container", "common"]);
  const columns = useContainerColumns();
  const { data, isLoading, error } = useContainers(filters);

  if (error) {
    console.error("Container table error:", error);
    return <div>{t("container:table.error", { message: error.message })}</div>;
  }

  const total = data?.total ?? 0;
  const page = data?.page ?? 1;
  const perPage = data?.per_page ?? filters.per_page ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const startItem = total === 0 ? 0 : (page - 1) * perPage + 1;
  const endItem = Math.min(page * perPage, total);

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        noResultsMessage={t("container:table.no_results")}
      />
      {total > 0 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground">
            {t("container:table.showing", {
              from: startItem,
              to: endItem,
              total,
            })}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {t("container:table.per_page")}
              </span>
              <Select
                value={String(perPage)}
                onValueChange={(value) =>
                  setFilters({ per_page: Number(value) })
                }
                disabled={isLoading}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PER_PAGE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                {t("common:buttons.previous")}
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {t("common:pagination.page_of", { page, totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages || isLoading}
              >
                {t("common:buttons.next")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
