"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  manualPagination?: boolean;
  page?: number;
  perPage?: number;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  onScrollChange?: (isScrolled: boolean) => void;
  isScrolled?: boolean;
  onPageCountChange?: (count: number) => void;
  onSearchFocus?: (focused: boolean) => void;
  isLoading?: boolean;
  filterControls?: React.ReactNode;
  headerActions?: React.ReactNode;
  mobileAddButton?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  manualPagination = false,
  page = 1,
  perPage = 10,
  onPageChange,
  onPerPageChange,
  onScrollChange,
  isScrolled = false,
  onPageCountChange,
  onSearchFocus,
  isLoading = false,
  filterControls,
  headerActions,
  mobileAddButton,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [searchFocused, setSearchFocused] = React.useState(false);
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  // Calculate pagination
  const currentPage = manualPagination ? page : 1;
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  
  // For manual pagination, slice the data before passing to table
  const tableData = manualPagination ? data.slice(startIndex, endIndex) : data;
  
  // Create table instance
  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      if (!searchKey) return true;
      const value = row.getValue(columnId) as string;
      if (!value) return false;
      return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
    },
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination: {
        pageIndex: 0, // Always page 0 for manual pagination since data is already sliced
        pageSize: perPage,
      },
    },
    manualPagination,
  });

  // Calculate total pages after table is created
  const totalPages = manualPagination
    ? Math.ceil(data.length / perPage)
    : table.getPageCount();

  // Update page count
  React.useEffect(() => {
    if (onPageCountChange) {
      onPageCountChange(totalPages);
    }
  }, [totalPages, onPageCountChange]);

  // Handle scroll detection
  React.useEffect(() => {
    const container = tableContainerRef.current;
    if (!container || !onScrollChange) return;

    const handleScroll = () => {
      const scrolled = container.scrollTop > 0;
      if (scrolled !== isScrolled) {
        onScrollChange(scrolled);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isScrolled, onScrollChange]);

  // Handle search focus
  React.useEffect(() => {
    if (onSearchFocus) {
      onSearchFocus(searchFocused);
    }
  }, [searchFocused, onSearchFocus]);

  const handlePageChange = (newPage: number) => {
    if (manualPagination && onPageChange) {
      onPageChange(newPage);
    } else {
      table.setPageIndex(newPage - 1);
    }
  };

  const handlePerPageChange = (newPerPage: number) => {
    if (onPerPageChange) {
      onPerPageChange(newPerPage);
    }
    if (!manualPagination) {
      table.setPageSize(newPerPage);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header with Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex-1 max-w-sm">
          {searchKey && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="pl-9 h-9"
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {filterControls}
          {headerActions}
        </div>
      </div>

      {/* Table Container */}
      <div
        ref={tableContainerRef}
        className="flex-1 min-h-0 overflow-auto rounded-md border"
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : React.isValidElement(header.column.columnDef.header)
                        ? header.column.columnDef.header
                        : typeof header.column.columnDef.header === "function"
                          ? header.column.columnDef.header(header.getContext())
                          : null}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {React.isValidElement(cell.column.columnDef.cell)
                        ? cell.column.columnDef.cell
                        : typeof cell.column.columnDef.cell === "function"
                          ? cell.column.columnDef.cell(cell.getContext())
                          : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination and Mobile Add Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t">
        <div className="flex items-center gap-2">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} results
          </p>
        </div>
        <div className="flex items-center gap-2">
          {mobileAddButton && (
            <div className="sm:hidden">{mobileAddButton}</div>
          )}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1 px-2">
              <span className="text-xs sm:text-sm text-muted-foreground">
                Page {currentPage} of {totalPages || 1}
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage >= totalPages || isLoading}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
          <Select
            value={perPage.toString()}
            onValueChange={(value) => handlePerPageChange(Number(value))}
            disabled={isLoading}
          >
            <SelectTrigger className="h-8 text-xs sm:text-sm" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="min-w-[var(--radix-select-trigger-width)]">
              <SelectItem value="10" className="[&_span[data-slot=select-item-indicator]]:hidden pr-2">
                10
              </SelectItem>
              <SelectItem value="20" className="[&_span[data-slot=select-item-indicator]]:hidden pr-2">
                20
              </SelectItem>
              <SelectItem value="50" className="[&_span[data-slot=select-item-indicator]]:hidden pr-2">
                50
              </SelectItem>
              <SelectItem value="100" className="[&_span[data-slot=select-item-indicator]]:hidden pr-2">
                100
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

