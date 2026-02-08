"use client";

import { useContainers } from "../../server/hooks/use-containers";
import { UseContainersParams } from "../../server/hooks/use-containers";
import { containerColumns } from "../columns/container-columns";
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

const PER_PAGE_OPTIONS = [10, 20, 50, 100];

type Props = {
  filters: UseContainersParams;
  setPage: (page: number) => void;
  setFilters: (next: Partial<UseContainersParams>) => void;
};

export function ContainerTable({ filters, setPage, setFilters }: Props) {
  const { data, isLoading, error } = useContainers(filters);

  if (error) {
    console.error("Container table error:", error);
    return <div>Error loading containers: {error.message}</div>;
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
        columns={containerColumns}
        data={data?.items ?? []}
        isLoading={isLoading}
      />
      {total > 0 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground">
            Showing {startItem} to {endItem} of {total} container
            {total !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Per page
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
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages || isLoading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
