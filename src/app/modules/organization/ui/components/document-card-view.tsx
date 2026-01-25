"use client";

import { File, Eye, Edit, Trash2, MoreHorizontal, Truck, User, Calendar } from "lucide-react";
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

interface DocumentCardViewProps {
  documents: OrganizationDocument[];
  onView: (id: string) => Promise<void>;
  onEdit: (id: string) => void;
  onDelete: (id: number) => void;
  onEntityClick?: (entityType: string, entityId: number | null) => void;
  isDeleting: boolean;
}

export function DocumentCardView({
  documents,
  onView,
  onEdit,
  onDelete,
  onEntityClick,
  isDeleting,
}: DocumentCardViewProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDocumentType = (type?: string) => {
    if (!type) return "Document";
    // Handle both uppercase (from UI) and lowercase (from backend)
    const typeUpper = type.toUpperCase();
    const typeMap: Record<string, string> = {
      TRADE_LICENCE: "Trade Licence",
      AUTHORISED_CONTACT_PERSON_COMPANY_ID: "Authorised Contact Person Company ID",
      OTHER: "Other",
    };
    return typeMap[typeUpper] || type.replace(/_/g, " ");
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <File className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-sm text-muted-foreground">No documents found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {documents.map((doc) => {
        const entityType = doc.entity_type;
        const entityId = entityType === "truck" ? doc.truck_id : doc.driver_id;

        return (
          <div
            key={doc.id}
            className="p-3 space-y-2 border border-border rounded-lg bg-card active:bg-accent/50 transition-colors"
          >
            {/* Header with Document Type and Actions */}
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-primary/10 text-primary shrink-0">
                <File className="h-3.5 w-3.5" />
              </div>
              <h3 className="font-semibold text-xs text-foreground truncate flex-1">
                {formatDocumentType(doc.document_type)}
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-6 w-6 p-0 shrink-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(String(doc.id))}>
                    <Eye className="mr-2 h-4 w-4" /> View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(String(doc.id))}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(doc.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Status Badge */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant="secondary"
                className={cn(
                  "font-semibold text-[9px] px-1.5 py-0.5 h-4 capitalize",
                  getStatusColor(doc.status || "pending")
                )}
              >
                {doc.status || "pending"}
              </Badge>
              {entityType && (
                <Badge
                  variant="outline"
                  className={cn(
                    "font-medium text-[9px] px-1.5 py-0.5 h-4 capitalize",
                    entityId
                      ? "cursor-pointer hover:bg-accent"
                      : "opacity-50 cursor-not-allowed"
                  )}
                  onClick={
                    entityId && onEntityClick
                      ? () => onEntityClick(entityType, entityId)
                      : undefined
                  }
                >
                  <div className="flex items-center gap-0.5">
                    {entityType === "truck" ? (
                      <Truck className="h-2.5 w-2.5" />
                    ) : entityType === "driver" ? (
                      <User className="h-2.5 w-2.5" />
                    ) : null}
                    <span className="truncate max-w-[40px]">{entityType}</span>
                  </div>
                </Badge>
              )}
            </div>

            {/* Date */}
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Calendar className="h-3 w-3 shrink-0" />
              <span className="truncate">{formatDate(doc.created_at)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

