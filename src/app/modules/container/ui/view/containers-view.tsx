"use client";

import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ContainerFilters } from "../components/container-filters";
import { ContainerSummary } from "../components/container-summary";
import { ContainerTable } from "../components/container-table";
import { ContainerActions } from "../components/container-actions";
import { CreateContainerDialog } from "../components/dialogs/create-container-dialog";
import { CreateContainerDrawer } from "../components/create-container-drawer";
import { useContainersFilters } from "../../server/hooks/use-containers-filters";
import { useContainers } from "../../server/hooks/use-containers";
import { cn } from "@/lib/utils";
import { Search, Plus, Box, Loader2 } from "lucide-react";
import type { Container } from "../../server/types/container.types";

const MOBILE_PER_PAGE = 15;

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "created", label: "Created" },
  { value: "price_requested", label: "Price requested" },
  { value: "priced", label: "Priced" },
  { value: "accepted", label: "Accepted" },
] as const;

function formatSize(size: string) {
  return size === "twenty_feet" ? "20ft" : "40ft";
}

function formatType(type: string) {
  const map: Record<string, string> = {
    dry: "Dry",
    reefer: "Refrigerated",
    open_top: "Open Top",
    tank: "Tank",
  };
  return map[type] ?? type.replace(/_/g, " ");
}

function formatStatus(status: string | undefined) {
  if (!status) return "CREATED";
  return status.replace(/_/g, " ").toUpperCase();
}

function statusClassName(status: string | undefined) {
  if (status === "created")
    return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border-0";
  if (status === "price_requested")
    return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200 border-0";
  if (status === "priced")
    return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border-0";
  if (status === "accepted")
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border-0";
  return "";
}

export function ContainersView() {
  const isMobile = useIsMobile();
  const filtersState = useContainersFilters();
  const [addOpen, setAddOpen] = useState(false);
  const [mobilePage, setMobilePage] = useState(1);
  const [accumulated, setAccumulated] = useState<Container[]>([]);
  const { filters, setFilters } = filtersState;

  const mobileParams = isMobile
    ? { ...filters, per_page: MOBILE_PER_PAGE, page: mobilePage }
    : filters;
  const { data, isLoading, isFetching } = useContainers(
    isMobile ? mobileParams : filters,
  );
  const total = data?.total ?? 0;
  const items = data?.items ?? [];

  // Reset mobile accumulation when search/filters change
  useEffect(() => {
    if (!isMobile) return;
    setMobilePage(1);
    setAccumulated([]);
  }, [isMobile, filters.container_number, filters.status]);

  // Accumulate items for mobile load-more
  useEffect(() => {
    if (!isMobile || !data?.items || data.page !== mobilePage) return;
    if (mobilePage === 1) {
      setAccumulated(data.items);
    } else {
      setAccumulated((prev) => [...prev, ...data.items]);
    }
  }, [isMobile, data?.items, data?.page, mobilePage]);

  const mobileItems = isMobile ? accumulated : items;
  const hasMore = isMobile && mobileItems.length < total && total > 0;

  if (isMobile) {
    return (
      <div className="space-y-4 pb-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-2 pb-3 border-b border-border">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Containers
          </h1>
          <Button
            size="sm"
            className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden xs:inline">Add Container</span>
            <span className="xs:hidden">Add</span>
          </Button>
        </header>
        <CreateContainerDrawer open={addOpen} onOpenChange={setAddOpen} />

        {/* Total Containers card */}
        <div className="rounded-xl border border-border bg-primary/5 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Containers</p>
            <p className="text-2xl font-bold text-foreground tabular-nums mt-0.5">
              {total}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Box className="h-6 w-6" strokeWidth={2} />
          </div>
        </div>

        {/* Status filter pills - scrollable, consistent with documents */}
        <div className="flex gap-2 overflow-x-auto overflow-y-hidden pb-2 scrollbar-hide -mx-0.5">
          {STATUS_TABS.map((tab) => {
            const isAll = tab.value === "";
            const isSelected = isAll
              ? !filters.status
              : filters.status === tab.value;
            return (
              <Button
                key={tab.value || "all"}
                variant="outline"
                size="sm"
                className={cn(
                  "shrink-0 rounded-full text-xs font-medium h-8 px-3",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground"
                    : "text-primary border-primary/30 hover:bg-primary/10",
                )}
                onClick={() =>
                  setFilters({ status: isAll ? undefined : tab.value })
                }
              >
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search container number"
            value={filters.container_number ?? ""}
            onChange={(e) =>
              setFilters({
                container_number: e.target.value || undefined,
              })
            }
            className="pl-9 h-10 rounded-xl bg-muted/30 border-border"
          />
        </div>

        {/* Container list */}
        <div className="space-y-3">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </>
          ) : mobileItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 py-12 px-4 text-center">
              <Box className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium text-foreground mb-1">
                No containers found
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Add a container or adjust your search.
              </p>
              <Button
                size="sm"
                className="bg-primary text-primary-foreground"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Container
              </Button>
            </div>
          ) : (
            mobileItems.map((container: Container) => (
              <div
                key={container.id}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">
                      {container.container_number}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                      <Box className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      {formatSize(container.container_size)} •{" "}
                      {formatType(container.container_type)}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium mt-2 ${statusClassName(
                        container.status,
                      )}`}
                    >
                      {formatStatus(container.status)}
                    </span>
                  </div>
                  <ContainerActions container={container} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load more */}
        {hasMore && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setMobilePage((p) => p + 1)}
              disabled={isFetching}
            >
              {isFetching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load more"
              )}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <ContainerFilters {...filtersState} />
        <CreateContainerDialog />
      </div>

      <ContainerSummary {...filtersState} />
      <ContainerTable {...filtersState} />
    </div>
  );
}
