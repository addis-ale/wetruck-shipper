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
}


export function ContainerAssignTable<TData, TValue>({
  columns,
  data,
  activeShipmentId,
  onAssignContainer,
  selectedContainers = [],
  onGetPrice,
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
    <Card>
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
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverAnchor asChild>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search containers…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                className="pl-9"
                disabled={!activeShipmentId}
              />
            </div>
          </PopoverAnchor>

          <PopoverContent
            className="w-[400px] p-0"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : availableContainers.length > 0 ? (
                <div className="divide-y">
                  {availableContainers.map((container) => (
                    <button
                      key={container.id}
                      onClick={() => handleContainerSelect(container)}
                      className="w-full p-3 text-left hover:bg-accent"
                    >
                      <div className="font-medium">
                        {container.container_number}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {container.container_size === "twenty_feet"
                          ? "20ft"
                          : "40ft"}{" "}
                        • {container.container_type}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  No available containers
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
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

        {/* Get Price */}
        {selectedContainers.length > 0 && (
          <div className="flex justify-end pt-2 border-t">
            <Button onClick={() => onGetPrice?.(selectedContainers)}>
              Get Price ({selectedContainers.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
