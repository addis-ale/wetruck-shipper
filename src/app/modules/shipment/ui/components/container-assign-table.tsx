"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { Search, Loader2, Plus, List } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useContainers } from "@/app/modules/container/server/hooks/use-containers";
import { CreateContainerDialog } from "@/app/modules/container/ui/components/dialogs/create-container-dialog";
import { ViewContainersSheet } from "@/app/modules/container/ui/components/view-containers-sheet";
import type { Container } from "@/app/modules/container/server/types/container.types";

// Extended container type
type ContainerWithShipId = Container & { ship_id?: number | null };
interface ContainerAssignTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  activeShipmentId: number | null;
  onAssignContainer?: (containerId: number) => void;
  /** Assign multiple containers at once (used when user selects multiple from the list) */
  onAssignContainers?: (containerIds: number[]) => void;
  onGetPrice?: (containerIds: number[]) => void;
  onRequestPrice?: (shipmentId: number) => void;
  shipmentStatus?: string;
  isRequestingPrice?: boolean;
}

export function ContainerAssignTable<TData, TValue>({
  columns,
  data,
  activeShipmentId,
  onAssignContainer,
  onAssignContainers,
  onGetPrice,
  onRequestPrice,
  shipmentStatus,
  isRequestingPrice = false,
}: ContainerAssignTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  /** IDs selected in the "assign from list" popover for bulk assign */
  const [selectedToAssign, setSelectedToAssign] = useState<number[]>([]);
  /** Pagination for search popover: start with 5, load more on scroll */
  const [searchPage, setSearchPage] = useState(1);
  const [searchAccumulated, setSearchAccumulated] = useState<Container[]>([]);
  const searchScrollRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(searchQuery.trim(), 300);
  const PER_PAGE = 5;

  const {
    data: containers,
    isLoading,
    isFetching,
  } = useContainers(
    {
      container_number: debouncedSearch || undefined,
      per_page: PER_PAGE,
      page: searchPage,
    },
    {
      enabled: !!activeShipmentId && searchOpen,
      staleTime: 0,
    },
  );

  const total = containers?.total ?? 0;

  // Accumulate search result pages (only when response matches requested page)
  useEffect(() => {
    if (!searchOpen || !containers?.items || containers.page !== searchPage)
      return;
    if (searchPage === 1) {
      setSearchAccumulated(containers.items);
    } else {
      setSearchAccumulated((prev) => [...prev, ...containers.items]);
    }
  }, [containers?.items, containers?.page, searchPage, searchOpen]);

  // Reset search pagination when search term changes (same as ViewContainersSheet)
  useEffect(() => {
    if (!searchOpen) return;
    setSearchPage(1);
    setSearchAccumulated([]);
  }, [debouncedSearch, searchOpen]);

  // Reset when popover closes (same as ViewContainersSheet)
  useEffect(() => {
    if (!searchOpen) {
      setSearchPage(1);
      setSearchAccumulated([]);
    }
  }, [searchOpen]);

  /** Display items: use accumulated list, or fall back to containers.items when it matches
   *  current page (avoids effect delay so we show data immediately on focus/search) */
  const displayItems =
    searchAccumulated.length > 0
      ? searchAccumulated
      : containers?.page === searchPage && containers?.items
        ? containers.items
        : [];

  const hasMoreSearch = displayItems.length < total;

  /** Only show unassigned containers from display list */
  const availableContainers = displayItems.filter((container) => {
    const shipId = (container as ContainerWithShipId).ship_id;
    return shipId === null || shipId === undefined || shipId === 0;
  });

  const handleSearchScroll = useCallback(() => {
    const el = searchScrollRef.current;
    if (!el || isFetching || !hasMoreSearch) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const threshold = 60;
    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      setSearchPage((p) => p + 1);
    }
  }, [isFetching, hasMoreSearch]);

  // Handle search change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const isSearching = isLoading || isFetching;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  // Close popover when shipment changes; clear selection
  useEffect(() => {
    setSearchOpen(false);
    setSearchQuery("");
    setIsFocused(false);
    setSelectedToAssign([]);
  }, [activeShipmentId]);

  const handleContainerSelect = (container: Container) => {
    onAssignContainer?.(container.id);
    setSearchQuery("");
    setSearchOpen(false);
    setIsFocused(false);
  };

  const toggleSelectToAssign = (containerId: number) => {
    setSelectedToAssign((prev) =>
      prev.includes(containerId)
        ? prev.filter((id) => id !== containerId)
        : [...prev, containerId],
    );
  };

  const selectAllToAssign = (checked: boolean) => {
    if (checked) {
      setSelectedToAssign(availableContainers.map((c) => c.id));
    } else {
      setSelectedToAssign([]);
    }
  };

  const handleAssignSelected = () => {
    if (selectedToAssign.length === 0) return;
    if (onAssignContainers) {
      onAssignContainers(selectedToAssign);
    } else {
      selectedToAssign.forEach((id) => onAssignContainer?.(id));
    }
    setSelectedToAssign([]);
    setSearchQuery("");
    setSearchOpen(false);
    setIsFocused(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setSearchOpen(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Check if the new focus target is inside the popover
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget?.closest("[data-radix-popper-content-wrapper]")) {
      return; // Don't close if clicking inside popover
    }
    // Delay closing to allow click on popover items
    setTimeout(() => {
      setSearchOpen(false);
      setIsFocused(false);
    }, 150);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Container Assignment</CardTitle>
        <CardDescription>
          {activeShipmentId
            ? "Search and assign available containers to this shipment."
            : "Select a shipment to manage containers."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search + Add New Container + View Containers */}
        <div className="flex flex-wrap items-center gap-2">
          <Popover open={searchOpen && isFocused} onOpenChange={setSearchOpen}>
            <PopoverAnchor asChild>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
                <Input
                  placeholder="Search containers by number..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                  disabled={!activeShipmentId || shipmentStatus !== "created"}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
            </PopoverAnchor>
            <PopoverContent
              className="w-[400px] p-0"
              align="start"
              onOpenAutoFocus={(e) => e.preventDefault()}
              sideOffset={5}
              onCloseAutoFocus={() => setSelectedToAssign([])}
            >
              <div
                ref={searchScrollRef}
                onScroll={handleSearchScroll}
                className="max-h-[220px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                {(isLoading || isFetching) && searchAccumulated.length === 0 ? (
                  <div className="flex items-center justify-center p-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : availableContainers.length > 0 ? (
                  <div className="divide-y">
                    {!debouncedSearch && (
                      <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground bg-muted/50 border-b">
                        <Checkbox
                          checked={
                            availableContainers.length > 0 &&
                            availableContainers.every((c) =>
                              selectedToAssign.includes(c.id),
                            )
                              ? true
                              : availableContainers.some((c) =>
                                    selectedToAssign.includes(c.id),
                                  )
                                ? "indeterminate"
                                : false
                          }
                          onCheckedChange={(checked) =>
                            selectAllToAssign(checked === true)
                          }
                          aria-label="Select all in list"
                        />
                        <span>
                          Select containers to assign •{" "}
                          {availableContainers.length} available
                          {hasMoreSearch ? " (scroll for more)" : ""}
                        </span>
                      </div>
                    )}
                    {availableContainers.map((container) => (
                      <label
                        key={container.id}
                        className="flex items-center gap-3 w-full p-2 cursor-pointer hover:bg-accent/50 transition-colors"
                      >
                        <Checkbox
                          checked={selectedToAssign.includes(container.id)}
                          onCheckedChange={() =>
                            toggleSelectToAssign(container.id)
                          }
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select ${container.container_number}`}
                        />
                        <div className="flex-1 min-w-0 text-left">
                          <div className="font-medium text-sm">
                            {container.container_number}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {container.container_size === "twenty_feet"
                              ? "20ft"
                              : "40ft"}{" "}
                            • {container.container_type}
                          </div>
                        </div>
                      </label>
                    ))}
                    {hasMoreSearch && isFetching && (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    {debouncedSearch
                      ? "No containers found"
                      : "No available containers"}
                  </div>
                )}
              </div>
              {availableContainers.length > 0 &&
                selectedToAssign.length > 0 && (
                  <div className="p-2 border-t bg-muted/30">
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={handleAssignSelected}
                    >
                      Assign selected ({selectedToAssign.length})
                    </Button>
                  </div>
                )}
            </PopoverContent>
          </Popover>
          {activeShipmentId && shipmentStatus === "created" && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateDialogOpen(true)}
                className="gap-1.5 shrink-0"
              >
                <Plus className="h-4 w-4" />
                Add New Container
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setViewSheetOpen(true)}
                className="gap-1.5 shrink-0"
              >
                <List className="h-4 w-4" />
                View Containers
              </Button>
            </>
          )}
        </div>

        <CreateContainerDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          hideTrigger
          onCreated={(container) => {
            onAssignContainer?.(container.id);
            setCreateDialogOpen(false);
          }}
        />

        <ViewContainersSheet
          open={viewSheetOpen}
          onOpenChange={setViewSheetOpen}
          activeShipmentId={activeShipmentId}
          onAssignContainers={onAssignContainers}
        />

        {/* Table */}
        <div className="rounded-md border w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <Table className="w-full">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No containers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination and Get Price Button */}
        {table.getRowModel().rows?.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {table.getRowModel().rows.length} of {data.length}{" "}
              container(s)
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Request Price Button - Show when status is "created" and has containers */}
        {data.length > 0 && activeShipmentId && (
          <div className="flex justify-end pt-2 border-t">
            {shipmentStatus === "created" && onRequestPrice ? (
              <Button
                onClick={() => onRequestPrice(activeShipmentId)}
                disabled={
                  isRequestingPrice || !activeShipmentId || data.length === 0
                }
                className="gap-2"
              >
                {isRequestingPrice ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Requesting Price...
                  </>
                ) : (
                  <>
                    Request Price ({data.length} container
                    {data.length !== 1 ? "s" : ""})
                  </>
                )}
              </Button>
            ) : shipmentStatus === "price_requested" ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-muted text-muted-foreground">
                <span className="text-sm font-medium">Price Requested</span>
              </div>
            ) : shipmentStatus ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-muted text-muted-foreground">
                <span className="text-sm">
                  Status:{" "}
                  {shipmentStatus
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
