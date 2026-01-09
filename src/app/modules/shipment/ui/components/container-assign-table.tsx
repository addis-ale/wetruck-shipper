"use client";

import { useState, useEffect, useCallback } from "react";
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
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Plus, Loader2, DollarSign } from "lucide-react";
import { useContainers } from "@/app/modules/container/server/hooks/use-containers";
import type { Container } from "@/app/modules/container/server/types/container.types";
import { cn } from "@/lib/utils";

// Extended container type with ship_id
type ContainerWithShipId = Container & { ship_id?: number | null };

interface ContainerAssignTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  activeShipmentId: number | null;
  onAssignContainer?: (containerId: number) => void;
  selectedContainers?: number[];
  onSelectionChange?: (containerIds: number[]) => void;
  onGetPrice?: (containerIds: number[]) => void;
}

export function ContainerAssignTable<TData, TValue>({
  columns,
  data,
  activeShipmentId,
  onAssignContainer,
  selectedContainers = [],
  onSelectionChange,
  onGetPrice,
}: ContainerAssignTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 800);

  // API search for containers
  const { data: searchResults, isLoading: isSearching } = useContainers(
    debouncedSearch && activeShipmentId
      ? {
          container_number: debouncedSearch,
          per_page: 10,
        }
      : undefined
  );


  const { data: allAvailableContainers, isLoading: isLoadingAvailable } =
    useContainers(
      assignModalOpen && activeShipmentId
        ? {
            per_page: 50, 
          }
        : undefined
    );

  // Helper function to filter unassigned containers
  const filterUnassigned = (containers: Container[]) => {
    return containers.filter((container) => {
      const shipId = (container as ContainerWithShipId).ship_id;
      if (shipId === null || shipId === undefined) return true;
      if (typeof shipId === "number" && shipId > 0) return false; 
      if (shipId === 0) return true; 
      return true; 
    });
  };

  const searchContainers = filterUnassigned(searchResults?.items || []);

  const availableContainers = filterUnassigned(
    allAvailableContainers?.items || []
  );

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

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (value.length > 0) {

    } else {
      setSearchOpen(false);
    }
  };

  useEffect(() => {
    if (debouncedSearch.length > 0 && searchQuery.length > 0) {
      setSearchOpen(true);
    }
  }, [debouncedSearch, searchQuery]);

  const handleContainerSelect = (container: Container) => {
    if (onAssignContainer && activeShipmentId) {
      onAssignContainer(container.id);
      setSearchQuery("");
      setSearchOpen(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Container Assignment</CardTitle>
        <CardDescription>
          {activeShipmentId
            ? "Showing containers for the selected shipment. Use search to find specific containers."
            : "Select a shipment from the sidebar to manage containers"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex items-center gap-2">
          <Popover
            open={searchOpen && debouncedSearch.length > 0}
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
                  disabled={!activeShipmentId}
                  onFocus={() => {
                    if (debouncedSearch.length > 0) {
                      setSearchOpen(true);
                    }
                  }}
                />
              </div>
            </PopoverAnchor>
            <PopoverContent
              className="w-[400px] p-0"
              align="start"
              onOpenAutoFocus={(e) => e.preventDefault()}
              sideOffset={5}
            >
              <div className="max-h-[300px] overflow-y-auto">
                {isSearching ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : searchContainers.length > 0 ? (
                  <div className="divide-y">
                    {searchContainers.map((container) => (
                      <button
                        key={container.id}
                        onClick={() => handleContainerSelect(container)}
                        className="w-full p-3 text-left hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {container.container_number}
                            </div>
                            <div className="text-sm text-muted-foreground">
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
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    No containers found
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <Popover open={assignModalOpen} onOpenChange={setAssignModalOpen}>
            <PopoverTrigger asChild>
              <Button disabled={!activeShipmentId} className="shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                Assign Container
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[400px] p-0"
              align="end"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div className="max-h-[400px] overflow-y-auto">
                {isLoadingAvailable ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : availableContainers.length > 0 ? (
                  <div className="divide-y">
                    {availableContainers.map((container) => (
                      <button
                        key={container.id}
                        onClick={() => {
                          handleContainerSelect(container);
                          setAssignModalOpen(false);
                        }}
                        className="w-full p-3 text-left hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {container.container_number}
                            </div>
                            <div className="text-sm text-muted-foreground">
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
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    No available containers found
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
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
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {activeShipmentId
                      ? "No containers found."
                      : "Select a shipment to view containers."}
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

        {/* Get Price Button */}
        {selectedContainers.length > 0 && (
          <div className="flex justify-end pt-2 border-t">
            <Button
              onClick={() => onGetPrice?.(selectedContainers)}
              disabled={!activeShipmentId || selectedContainers.length === 0}
              className="gap-2"
            >
              Get Price ({selectedContainers.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
