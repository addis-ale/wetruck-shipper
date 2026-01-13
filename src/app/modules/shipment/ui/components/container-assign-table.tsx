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
import { Search, Loader2, Container as ContainerIcon } from "lucide-react";
import { useContainers } from "@/app/modules/container/server/hooks/use-containers";
import type { Container } from "@/app/modules/container/server/types/container.types";
import { Badge } from "@/components/ui/badge";

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

  const debouncedSearch = useDebounce(searchQuery, 500);

  /** Fetch containers even when search is empty */
  const { data: containers, isLoading } = useContainers(
    activeShipmentId
      ? {
          container_number: debouncedSearch || undefined,
          per_page: 20,
        }
      : undefined
  );

  /** Only show unassigned containers */
  const availableContainers =
    containers?.items.filter((container) => {
      const shipId = (container as ContainerWithShipId).ship_id;
      return shipId === null || shipId === undefined || shipId === 0;
    }) || [];

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

  useEffect(() => {
    if (activeShipmentId) {
      setSearchOpen(true);
    }
  }, [activeShipmentId]);

  const handleContainerSelect = (container: Container) => {
    onAssignContainer?.(container.id);
    setSearchQuery("");
    setSearchOpen(false);
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
        <Popover 
          open={searchOpen && activeShipmentId !== null} 
          onOpenChange={setSearchOpen}
        >
          <PopoverAnchor asChild>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search containers by number…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => activeShipmentId && setSearchOpen(true)}
                className="pl-9 w-full"
                disabled={!activeShipmentId}
              />
              {!activeShipmentId && (
                <div className="absolute inset-0 bg-background/50 cursor-not-allowed rounded-md" />
              )}
            </div>
          </PopoverAnchor>

          <PopoverContent
            className="p-0 shadow-lg border w-[calc(100vw-2rem)] sm:w-full max-w-none"
            align="start"
            sideOffset={4}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
            style={{
              width: 'var(--radix-popover-trigger-width)',
              maxWidth: 'none'
            }}
          >
            <div className="border-b px-4 py-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Available Containers</h4>
                <Badge variant="outline" className="text-xs">
                  {availableContainers.length} found
                </Badge>
              </div>
              {searchQuery && (
                <p className="text-xs text-muted-foreground mt-1">
                  Searching for: "{searchQuery}"
                </p>
              )}
            </div>

            <div className="max-h-[320px] overflow-y-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Loading containers...</p>
                </div>
              ) : availableContainers.length > 0 ? (
                <div className="divide-y">
                  {availableContainers.map((container) => (
                    <button
                      key={container.id}
                      onClick={() => handleContainerSelect(container)}
                      className="w-full p-4 text-left hover:bg-accent transition-colors duration-150 flex items-start gap-3 group"
                    >
                      <div className="mt-1 shrink-0">
                        <ContainerIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {container.container_number}
                          </span>
                          <Badge variant="secondary" className="text-xs font-normal shrink-0">
                            {container.container_size === "twenty_feet" ? "20ft" : "40ft"}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 truncate">
                          Type: {container.container_type}
                        </div>
                    
                      </div>
                      <div className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                        Select →
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <ContainerIcon className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">
                    No containers found
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {searchQuery 
                      ? `No available containers matching "${searchQuery}"`
                      : "All containers are currently assigned or no containers available"}
                  </p>
                </div>
              )}
            </div>

            {availableContainers.length > 0 && (
              <div className="border-t px-4 py-2 bg-muted/20">
                <p className="text-xs text-muted-foreground text-center">
                  Click a container to assign it to this shipment
                </p>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Table */}
        <div className="rounded-md border w-full overflow-x-auto">
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