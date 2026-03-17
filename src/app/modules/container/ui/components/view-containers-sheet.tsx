"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useContainers } from "../../server/hooks/use-containers";
import { useDebounce } from "@/hooks/use-debounce";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search } from "lucide-react";
import type { Container } from "../../server/types/container.types";
import { useTranslation } from "react-i18next";

const PER_PAGE = 20;

function useFormatters() {
  const { t } = useTranslation("common");

  const formatSize = (size: string) =>
    t(`common:container_sizes.${size}`, {
      defaultValue: size.replace(/_/g, " "),
    });

  const formatType = (type: string) =>
    t(`common:container_types.${type}`, {
      defaultValue: type.replace(/_/g, " "),
    });

  return { formatSize, formatType };
}

export interface ViewContainersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, show checkboxes on available containers and "Assign selected" button */
  activeShipmentId?: number | null;
  onAssignContainers?: (containerIds: number[]) => void;
}

export function ViewContainersSheet({
  open,
  onOpenChange,
  activeShipmentId,
  onAssignContainers,
}: ViewContainersSheetProps) {
  const { t } = useTranslation(["container", "common"]);
  const { formatSize, formatType } = useFormatters();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState<Container[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearch = useDebounce(searchQuery.trim(), 300);

  const { data, isLoading, isFetching } = useContainers(
    {
      per_page: PER_PAGE,
      page,
      container_number: debouncedSearch || undefined,
    },
    { enabled: open },
  );

  // Reset pagination when search changes
  useEffect(() => {
    if (!open) return;
    setPage(1);
    setAccumulated([]);
  }, [debouncedSearch, open]);

  const total = data?.total ?? 0;
  const hasMore = accumulated.length < total;

  // Accumulate pages: first page replaces, next pages append (only when response matches requested page)
  useEffect(() => {
    if (!open || !data?.items || data.page !== page) return;
    if (page === 1) {
      setAccumulated(data.items);
    } else {
      setAccumulated((prev) => [...prev, ...data.items]);
    }
  }, [data?.items, data?.page, page, open]);

  const availableContainers = accumulated.filter(
    (c) => c.ship_id == null || c.ship_id === 0,
  );
  const canAssign = Boolean(
    activeShipmentId && onAssignContainers && availableContainers.length > 0,
  );
  const showOnlyAvailable = Boolean(activeShipmentId && onAssignContainers);
  const listContainers = showOnlyAvailable ? availableContainers : accumulated;

  // Reset when sheet closes
  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
      setPage(1);
      setAccumulated([]);
      setSearchQuery("");
    }
  }, [open]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectAllAvailable = (checked: boolean) => {
    if (checked) {
      setSelectedIds(listContainers.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleAssignSelected = () => {
    if (selectedIds.length === 0 || !onAssignContainers) return;
    onAssignContainers(selectedIds);
    setSelectedIds([]);
    onOpenChange(false);
  };

  const allAvailableSelected =
    listContainers.length > 0 &&
    listContainers.every((c) => selectedIds.includes(c.id));
  const someAvailableSelected =
    listContainers.some((c) => selectedIds.includes(c.id)) &&
    !allAvailableSelected;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full max-h-full flex-col sm:max-w-lg">
        <SheetHeader className="shrink-0">
          <SheetTitle>
            {showOnlyAvailable
              ? t("container:view_sheet.available_title")
              : t("container:view_sheet.all_title")}
          </SheetTitle>
          <SheetDescription>
            {showOnlyAvailable
              ? t("container:view_sheet.available_desc")
              : t("container:view_sheet.all_desc")}
          </SheetDescription>
        </SheetHeader>
        <div className="shrink-0 px-4 -mt-2 mb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={t("container:view_sheet.search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
              disabled={!open}
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden px-4 mt-0">
          <ScrollArea className="h-full">
            {isLoading && accumulated.length === 0 ? (
              <div className="space-y-2 px-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : isFetching && accumulated.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 px-1">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {t("container:view_sheet.searching")}
                </p>
              </div>
            ) : listContainers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 px-1">
                {debouncedSearch
                  ? t("container:view_sheet.no_match")
                  : showOnlyAvailable
                  ? t("container:view_sheet.no_available")
                  : t("container:view_sheet.no_containers")}
              </p>
            ) : (
              <ul className="space-y-1 py-2 px-1">
                {canAssign && listContainers.length > 0 && (
                  <li className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground bg-muted/50 rounded-lg mb-2">
                    <Checkbox
                      checked={
                        allAvailableSelected
                          ? true
                          : someAvailableSelected
                          ? "indeterminate"
                          : false
                      }
                      onCheckedChange={(checked) =>
                        selectAllAvailable(checked === true)
                      }
                      aria-label={t("common:select")}
                    />
                    <span>
                      {t("container:view_sheet.available_count", {
                        count: listContainers.length,
                      })}
                    </span>
                  </li>
                )}
                {listContainers.map((c) => {
                  const isSelected = selectedIds.includes(c.id);
                  const showCheckbox = canAssign;

                  return (
                    <li
                      key={c.id}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${
                        showCheckbox ? "cursor-pointer hover:bg-accent/50" : ""
                      }`}
                      onClick={
                        showCheckbox ? () => toggleSelect(c.id) : undefined
                      }
                    >
                      {showCheckbox ? (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(c.id)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`${t("common:select")} ${
                            c.container_number
                          }`}
                        />
                      ) : (
                        <span className="w-5 shrink-0" aria-hidden />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">
                          {c.container_number}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          {formatSize(c.container_size)} •{" "}
                          {formatType(c.container_type)}
                        </span>
                      </div>
                    </li>
                  );
                })}
                {hasMore && (
                  <li className="pt-2 pb-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={isFetching}
                    >
                      {isFetching ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          {t("common:buttons.loading")}
                        </>
                      ) : (
                        <>{t("container:load_more")}</>
                      )}
                    </Button>
                  </li>
                )}
              </ul>
            )}
          </ScrollArea>
        </div>
        {canAssign && selectedIds.length > 0 && (
          <div className="shrink-0 border-t pt-3 mt-3 pb-4">
            <Button className="w-full" size="sm" onClick={handleAssignSelected}>
              {t("container:view_sheet.assign_selected", {
                count: selectedIds.length,
              })}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
