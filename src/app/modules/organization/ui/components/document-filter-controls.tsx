"use client";

import { useState } from "react";
import { ChevronsUpDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

const DOCUMENT_TYPES = [
  { value: "TRADE_LICENCE", label: "Trade Licence" },
  { value: "AUTHORISED_CONTACT_PERSON_COMPANY_ID", label: "Authorised Contact Person Company ID" },
  { value: "OTHER", label: "Other" },
] as const;

const DOCUMENT_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
] as const;

const ENTITY_TYPES = [
  { value: "truck", label: "Truck" },
  { value: "driver", label: "Driver" },
] as const;

interface DocumentFilterControlsProps {
  filters: {
    status?: "pending" | "approved" | "rejected" | null;
    document_type?: "TRADE_LICENCE" | "AUTHORISED_CONTACT_PERSON_COMPANY_ID" | "OTHER" | null;
    entity_type?: "truck" | "driver" | null;
  };
  onStatusFilter: (
    status: "pending" | "approved" | "rejected" | "all" | null
  ) => void;
  onDocumentTypeFilter: (
    type: "TRADE_LICENCE" | "AUTHORISED_CONTACT_PERSON_COMPANY_ID" | "OTHER" | "all" | null
  ) => void;
  onEntityTypeFilter: (type: "truck" | "driver" | "all" | null) => void;
  onClearFilters: () => void;
}

export function DocumentFilterControls({
  filters,
  onStatusFilter,
  onDocumentTypeFilter,
  onEntityTypeFilter,
  onClearFilters,
}: DocumentFilterControlsProps) {
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isDocumentTypeFilterOpen, setIsDocumentTypeFilterOpen] =
    useState(false);
  const [isEntityTypeFilterOpen, setIsEntityTypeFilterOpen] = useState(false);

  return (
    <div className="flex items-center gap-2 w-full flex-wrap sm:flex-nowrap">
      <Popover open={isStatusFilterOpen} onOpenChange={setIsStatusFilterOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9 text-xs sm:text-sm min-w-[100px] sm:min-w-0 flex-1 sm:flex-initial whitespace-nowrap">
            <span className="hidden sm:inline">Status: </span>
            {filters.status
              ? DOCUMENT_STATUSES.find((s) => s.value === filters.status)?.label
              : "All"}
            <ChevronsUpDownIcon className="ml-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 min-w-[140px] sm:min-w-0"
          align="start"
          sideOffset={4}
          style={{
            width: "max(var(--radix-popover-trigger-width), 140px)",
          }}
        >
          <Command>
            <CommandList>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    onStatusFilter("all");
                    setIsStatusFilterOpen(false);
                  }}
                  className={cn(
                    !filters.status && "bg-amber-100 text-amber-700 font-medium",
                    "whitespace-nowrap"
                  )}
                >
                  All
                </CommandItem>
                {DOCUMENT_STATUSES.map((status) => (
                  <CommandItem
                    key={status.value}
                    onSelect={() => {
                      onStatusFilter(status.value);
                      setIsStatusFilterOpen(false);
                    }}
                    className={cn(
                      status.value === filters.status &&
                        "bg-amber-100 text-amber-700 font-medium",
                      "whitespace-nowrap"
                    )}
                  >
                    {status.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Popover
        open={isDocumentTypeFilterOpen}
        onOpenChange={setIsDocumentTypeFilterOpen}
      >
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9 text-xs sm:text-sm min-w-[120px] sm:min-w-0 flex-1 sm:flex-initial whitespace-nowrap">
            <span className="hidden sm:inline">Document Type: </span>
            {filters.document_type
              ? DOCUMENT_TYPES.find((t) => t.value === filters.document_type)
                  ?.label
              : "All"}
            <ChevronsUpDownIcon className="ml-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 min-w-[160px] sm:min-w-0"
          align="start"
          sideOffset={4}
          style={{
            width: "max(var(--radix-popover-trigger-width), 160px)",
          }}
        >
          <Command>
            <CommandList>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    onDocumentTypeFilter("all");
                    setIsDocumentTypeFilterOpen(false);
                  }}
                  className={cn(
                    !filters.document_type &&
                      "bg-amber-100 text-amber-700 font-medium",
                    "whitespace-nowrap"
                  )}
                >
                  All
                </CommandItem>
                {DOCUMENT_TYPES.map((type) => (
                  <CommandItem
                    key={type.value}
                    onSelect={() => {
                      onDocumentTypeFilter(type.value);
                      setIsDocumentTypeFilterOpen(false);
                    }}
                    className={cn(
                      type.value === filters.document_type &&
                        "bg-amber-100 text-amber-700 font-medium",
                      "whitespace-nowrap"
                    )}
                  >
                    {type.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Popover
        open={isEntityTypeFilterOpen}
        onOpenChange={setIsEntityTypeFilterOpen}
      >
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9 text-xs sm:text-sm min-w-[100px] sm:min-w-0 flex-1 sm:flex-initial whitespace-nowrap">
            <span className="hidden sm:inline">Entity Type: </span>
            {filters.entity_type
              ? ENTITY_TYPES.find((t) => t.value === filters.entity_type)?.label
              : "All"}
            <ChevronsUpDownIcon className="ml-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 min-w-[140px] sm:min-w-0"
          align="start"
          sideOffset={4}
          style={{
            width: "max(var(--radix-popover-trigger-width), 140px)",
          }}
        >
          <Command>
            <CommandList>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    onEntityTypeFilter("all");
                    setIsEntityTypeFilterOpen(false);
                  }}
                  className={cn(
                    !filters.entity_type &&
                      "bg-amber-100 text-amber-700 font-medium",
                    "whitespace-nowrap"
                  )}
                >
                  All
                </CommandItem>
                {ENTITY_TYPES.map((type) => (
                  <CommandItem
                    key={type.value}
                    onSelect={() => {
                      onEntityTypeFilter(type.value);
                      setIsEntityTypeFilterOpen(false);
                    }}
                    className={cn(
                      type.value === filters.entity_type &&
                        "bg-amber-100 text-amber-700 font-medium",
                      "whitespace-nowrap"
                    )}
                  >
                    {type.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {(filters.status || filters.document_type || filters.entity_type) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-9 text-xs sm:text-sm shrink-0"
        >
          Clear
        </Button>
      )}
    </div>
  );
}
