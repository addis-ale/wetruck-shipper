"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Trash2,
  File,
  Edit,
  Truck,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrganizationDocument } from "@/lib/api/organization";
import i18next from "i18next";

export type OrganizationDocumentTableRow = OrganizationDocument;

const formatDocumentType = (type?: string) => {
  const t = i18next.t.bind(i18next);
  if (!type) return t("common:labels.documents");
  const typeUpper = type.toUpperCase();
  const typeMap: Record<string, string> = {
    TRADE_LICENCE: t("common:document_types.trade_licence"),
    AUTHORISED_CONTACT_PERSON_COMPANY_ID: t("common:document_types.authorised_contact_person_company_id"),
    OTHER: t("common:document_types.other"),
  };
  return typeMap[typeUpper] || type.replace(/_/g, " ");
};

export const organizationDocumentColumns = (
  onView: (id: string) => Promise<void>,
  onEdit: (id: string) => void,
  onDelete: (id: number) => void,
  isDeleting: boolean,
  onEntityClick?: (entityType: string, entityId: number | null) => void
): ColumnDef<OrganizationDocumentTableRow>[] => [
  {
    accessorKey: "document_type",
    id: "document_type",
    enableHiding: false,
    header: ({ column }) => {
      return (
        <span
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-xs sm:text-sm flex items-center cursor-pointer px-1"
        >
          {i18next.t("organization:columns.document_type")}
          <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
        </span>
      );
    },
    cell: ({ row }) => {
      const doc = row.original;
      return (
        <div className="flex items-center gap-2 min-w-[120px] sm:min-w-[140px]">
          <File className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium text-xs sm:text-sm">
            {formatDocumentType(doc.document_type)}
          </span>
        </div>
      );
    },
    meta: {
      sticky: true,
    },
  },
  {
    accessorKey: "entity_type",
    id: "entity_type",
    header: ({ column }) => {
      return (
        <span
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-xs sm:text-sm flex items-center cursor-pointer px-1"
        >
          {i18next.t("organization:columns.entity_type")}
          <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
        </span>
      );
    },
    cell: ({ row }) => {
      const doc = row.original;
      const entityType = doc.entity_type;
      const entityId = entityType === "truck" ? doc.truck_id : doc.driver_id;

      if (!entityType) {
        return <div className="text-xs sm:text-sm">—</div>;
      }

      const handleClick = () => {
        if (entityId && onEntityClick) {
          onEntityClick(entityType, entityId);
        }
      };

      return (
        <div className="min-w-[80px] sm:min-w-[100px]">
          <Badge
            variant="outline"
            className={cn(
              "font-medium text-xs px-2 py-0.5 h-6 capitalize cursor-pointer hover:bg-accent transition-colors",
              entityId ? "" : "opacity-50 cursor-not-allowed"
            )}
            onClick={entityId ? handleClick : undefined}
          >
            <div className="flex items-center gap-1.5">
              {entityType === "truck" ? (
                <Truck className="h-3 w-3" />
              ) : entityType === "driver" ? (
                <User className="h-3 w-3" />
              ) : null}
              <span>{entityType}</span>
            </div>
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    id: "status",
    header: ({ column }) => {
      return (
        <span
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-xs sm:text-sm flex items-center cursor-pointer px-1"
        >
          {i18next.t("organization:columns.status")}
          <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
        </span>
      );
    },
    cell: ({ row }) => {
      const doc = row.original;
      const status = doc.status || "pending";

      const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
          case "approved":
            return "bg-green-100 text-green-700 hover:bg-green-100";
          case "rejected":
            return "bg-red-100 text-red-700 hover:bg-red-100";
          case "pending":
            return "bg-amber-100 text-amber-700 hover:bg-amber-100";
          default:
            return "bg-gray-100 text-gray-700 hover:bg-gray-100";
        }
      };

      return (
        <div className="min-w-[80px]">
          <Badge
            variant="secondary"
            className={cn(
              "font-semibold text-[10px] px-1.5 py-0.5 h-5 capitalize",
              getStatusColor(status)
            )}
          >
            {status}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    id: "created_at",
    header: ({ column }) => {
      return (
        <span
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-xs sm:text-sm flex items-center cursor-pointer px-1"
        >
          {i18next.t("organization:columns.uploaded_date")}
          <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
        </span>
      );
    },
    cell: ({ row }) => {
      const doc = row.original;
      const date = doc.created_at
        ? new Date(doc.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "—";
      return (
        <div className="text-xs sm:text-sm min-w-[100px] whitespace-nowrap">
          {date}
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const doc = row.original;

      return (
        <div className="text-right min-w-[50px] sm:min-w-[60px] flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                <span className="sr-only">{i18next.t("common:open_menu")}</span>
                <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(String(doc.id))}>
                <Eye className="mr-2 h-4 w-4" /> {i18next.t("common:buttons.view")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(String(doc.id))}>
                <Edit className="mr-2 h-4 w-4" /> {i18next.t("common:buttons.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(doc.id)}
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" /> {i18next.t("common:buttons.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
