"use client";

import { useState, useEffect } from "react";
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
import { Search, Loader2 } from "lucide-react";
import { useContainers } from "@/app/modules/container/server/hooks/use-containers";
import type { Container } from "@/app/modules/container/server/types/container.types";

// Extended container type
type ContainerWithShipId = Container & { ship_id?: number | null };
interface ContainerAssignTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  activeShipmentId: number | null;
  onAssignContainer?: (containerId: number) => void;
  selectedContainers?: number[];
  onSelectionChange?: (containerIds: number[]) => void;
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
  selectedContainers = [],
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

  const debouncedSearch = useDebounce(searchQuery, 300);

  /** Fetch containers when focused - limit to 5 when showing initial results, 10 when searching */
  const { data: containers, isLoading, isFetching } = useContainers(
    {
      container_number: debouncedSearch || undefined,
      per_page: debouncedSearch ? 10 : 5,
    },
    { 
      enabled: !!activeShipmentId && searchOpen,
      staleTime: 0, // Always refetch when params change
    }
  );

  /** Only show unassigned containers */
  const availableContainers =
    containers?.items.filter((container) => {
      const shipId = (container as ContainerWithShipId).ship_id;
      return shipId === null || shipId === undefined || shipId === 0;
    }) || [];

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

  // Close popover when shipment changes
  useEffect(() => {
    setSearchOpen(false);
    setSearchQuery("");
    setIsFocused(false);
  }, [activeShipmentId]);

  const handleContainerSelect = (container: Container) => {
    onAssignContainer?.(container.id);
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
    if (relatedTarget?.closest('[data-radix-popper-content-wrapper]')) {
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
        {/* Search */}
        <div className="flex items-center gap-2">
          <Popover
            open={searchOpen && isFocused}
            onOpenChange={setSearchOpen}
          >
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
            >
              <div className="max-h-[180px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {isSearching ? (
                  <div className="flex items-center justify-center p-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : availableContainers.length > 0 ? (
                  <div className="divide-y">
                    {!debouncedSearch && (
                      <div className="px-3 py-1.5 text-xs text-muted-foreground bg-muted/50">
                        Showing {availableContainers.length} available containers • Type to search
                      </div>
                    )}
                    {availableContainers.map((container) => (
                      <button
                        key={container.id}
                        onClick={() => handleContainerSelect(container)}
                        className="w-full p-2 text-left hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
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
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    {debouncedSearch ? "No containers found" : "No available containers"}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

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
                        header.getContext()
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
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
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
              {selectedContainers.length > 0 && (
                <span className="ml-2 text-primary">
                  • {selectedContainers.length} selected
                </span>
              )}
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
                disabled={isRequestingPrice || !activeShipmentId || data.length === 0}
                className="gap-2"
              >
                {isRequestingPrice ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Requesting Price...
                  </>
                ) : (
                  <>
                    Request Price ({data.length} container{data.length !== 1 ? "s" : ""})
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
                  Status: {shipmentStatus.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
              </div>
            ) : null}
          </div>
        )}
        
        {/* Get Price Button - For selected containers (if still needed) */}
        {selectedContainers.length > 0 && onGetPrice && (
          <div className="flex justify-end pt-2 border-t">
            <Button
              variant="outline"
              onClick={() => onGetPrice(selectedContainers)}
              disabled={!activeShipmentId || selectedContainers.length === 0}
              className="gap-2"
            >
              Get Price Quote ({selectedContainers.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}