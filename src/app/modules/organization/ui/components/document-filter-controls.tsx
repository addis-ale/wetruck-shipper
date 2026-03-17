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
import { useTranslation } from "react-i18next";

const DOCUMENT_TYPE_VALUES = ["TRADE_LICENCE", "AUTHORISED_CONTACT_PERSON_COMPANY_ID", "OTHER"] as const;
const DOCUMENT_STATUS_VALUES = ["pending", "approved", "rejected"] as const;
const ENTITY_TYPE_VALUES = ["truck", "driver"] as const;

interface DocumentFilterControlsProps {
  filters: {
    status?: "pending" | "approved" | "rejected" | null;
    document_type?:
      | "TRADE_LICENCE"
      | "AUTHORISED_CONTACT_PERSON_COMPANY_ID"
      | "OTHER"
      | null;
    entity_type?: "truck" | "driver" | null;
  };
  onStatusFilter: (
    status: "pending" | "approved" | "rejected" | "all" | null,
  ) => void;
  onDocumentTypeFilter: (
    type:
      | "TRADE_LICENCE"
      | "AUTHORISED_CONTACT_PERSON_COMPANY_ID"
      | "OTHER"
      | "all"
      | null,
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
  const { t } = useTranslation(["organization", "common"]);

  const DOC_TYPE_LABEL_MAP: Record<string, string> = {
    TRADE_LICENCE: t("common:document_types.trade_licence"),
    AUTHORISED_CONTACT_PERSON_COMPANY_ID: t("common:document_types.authorised_contact_person_company_id"),
    OTHER: t("common:document_types.other"),
  };
  const STATUS_LABEL_MAP: Record<string, string> = {
    pending: t("common:status.pending"),
    approved: t("common:status.approved"),
    rejected: t("common:status.rejected"),
  };
  const ENTITY_LABEL_MAP: Record<string, string> = {
    truck: t("organization:filters.truck"),
    driver: t("organization:filters.driver"),
  };
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isDocumentTypeFilterOpen, setIsDocumentTypeFilterOpen] =
    useState(false);
  const [isEntityTypeFilterOpen, setIsEntityTypeFilterOpen] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full flex-wrap sm:flex-nowrap">
      {/* Mobile: status pill buttons - full width */}
      <div className="grid grid-cols-4 gap-2 w-full sm:hidden">
        {(["all", "approved", "pending", "rejected"] as const).map((status) => {
          const isAll = status === "all";
          const isSelected = isAll
            ? !filters.status
            : filters.status === status;
          return (
            <Button
              key={status}
              variant="outline"
              size="sm"
              className={cn(
                "w-full rounded-full text-xs font-medium capitalize h-8 px-2",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground"
                  : "text-primary border-primary/30 hover:bg-primary/10",
              )}
              onClick={() => onStatusFilter(isAll ? "all" : status)}
            >
              {isAll ? t("organization:filters.all") : STATUS_LABEL_MAP[status] ?? status}
            </Button>
          );
        })}
      </div>
      <div className="hidden sm:flex items-center gap-2 w-full flex-wrap sm:flex-nowrap">
        <Popover open={isStatusFilterOpen} onOpenChange={setIsStatusFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-9 text-xs sm:text-sm min-w-[100px] sm:min-w-0 flex-1 sm:flex-initial whitespace-nowrap"
            >
              <span className="hidden sm:inline">{t("organization:filters.status")} </span>
              {filters.status
                ? STATUS_LABEL_MAP[filters.status]
                : t("organization:filters.all")}
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
                      !filters.status &&
                        "bg-amber-100 text-amber-700 font-medium",
                      "whitespace-nowrap",
                    )}
                  >
                    {t("organization:filters.all")}
                  </CommandItem>
                  {DOCUMENT_STATUS_VALUES.map((value) => (
                    <CommandItem
                      key={value}
                      onSelect={() => {
                        onStatusFilter(value);
                        setIsStatusFilterOpen(false);
                      }}
                      className={cn(
                        value === filters.status &&
                          "bg-amber-100 text-amber-700 font-medium",
                        "whitespace-nowrap",
                      )}
                    >
                      {STATUS_LABEL_MAP[value]}
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
            <Button
              variant="outline"
              className="h-9 text-xs sm:text-sm min-w-[120px] sm:min-w-0 flex-1 sm:flex-initial whitespace-nowrap"
            >
              <span className="hidden sm:inline">{t("organization:filters.document_type")} </span>
              {filters.document_type
                ? DOC_TYPE_LABEL_MAP[filters.document_type]
                : t("organization:filters.all")}
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
                      "whitespace-nowrap",
                    )}
                  >
                    {t("organization:filters.all")}
                  </CommandItem>
                  {DOCUMENT_TYPE_VALUES.map((value) => (
                    <CommandItem
                      key={value}
                      onSelect={() => {
                        onDocumentTypeFilter(value);
                        setIsDocumentTypeFilterOpen(false);
                      }}
                      className={cn(
                        value === filters.document_type &&
                          "bg-amber-100 text-amber-700 font-medium",
                        "whitespace-nowrap",
                      )}
                    >
                      {DOC_TYPE_LABEL_MAP[value]}
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
            <Button
              variant="outline"
              className="h-9 text-xs sm:text-sm min-w-[100px] sm:min-w-0 flex-1 sm:flex-initial whitespace-nowrap"
            >
              <span className="hidden sm:inline">{t("organization:filters.entity_type")} </span>
              {filters.entity_type
                ? ENTITY_LABEL_MAP[filters.entity_type]
                : t("organization:filters.all")}
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
                      "whitespace-nowrap",
                    )}
                  >
                    {t("organization:filters.all")}
                  </CommandItem>
                  {ENTITY_TYPE_VALUES.map((value) => (
                    <CommandItem
                      key={value}
                      onSelect={() => {
                        onEntityTypeFilter(value);
                        setIsEntityTypeFilterOpen(false);
                      }}
                      className={cn(
                        value === filters.entity_type &&
                          "bg-amber-100 text-amber-700 font-medium",
                        "whitespace-nowrap",
                      )}
                    >
                      {ENTITY_LABEL_MAP[value]}
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
            {t("organization:filters.clear")}
          </Button>
        )}
      </div>
    </div>
  );
}
