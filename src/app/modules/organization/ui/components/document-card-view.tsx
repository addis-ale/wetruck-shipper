"use client";

import {
  FileText,
  File,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Truck,
  User,
  Calendar,
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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation(["organization", "common"]);
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-primary text-primary-foreground border-0";
      case "rejected":
        return "bg-red-500 text-white border-0";
      case "pending":
        return "bg-amber-500 text-white border-0";
      default:
        return "bg-muted text-muted-foreground";
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
    if (!type) return t("common:labels.documents");
    const typeUpper = type.toUpperCase();
    const typeMap: Record<string, string> = {
      TRADE_LICENCE: t("common:document_types.trade_licence"),
      AUTHORISED_CONTACT_PERSON_COMPANY_ID: t("common:document_types.authorised_contact_person_company_id"),
      OTHER: t("common:document_types.other"),
    };
    return typeMap[typeUpper] || type.replace(/_/g, " ");
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <File className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-sm text-muted-foreground">{t("organization:card_view.no_documents")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-3">
      {documents.map((doc) => {
        const entityType = doc.entity_type;
        const entityId = entityType === "truck" ? doc.truck_id : doc.driver_id;
        const status = doc.status || "pending";
        const isPending = status === "pending";

        return (
          <div
            key={doc.id}
            className="p-4 border border-border rounded-xl bg-card shadow-sm space-y-3 sm:space-y-2 sm:p-3"
          >
            {/* Mobile: icon left, title, status right; subtitle Organization */}
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "p-2.5 rounded-lg shrink-0",
                  isPending
                    ? "bg-amber-500/10 text-amber-600"
                    : "bg-primary/10 text-primary",
                )}
              >
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-foreground">
                  {formatDocumentType(doc.document_type)}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("organization:card_view.organization")}
                </p>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  "shrink-0 font-semibold text-[10px] px-2 py-0.5 capitalize",
                  getStatusColor(status),
                )}
              >
                {status}
              </Badge>
            </div>

            {/* Date row */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-border/50">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>{formatDate(doc.created_at)}</span>
            </div>

            {/* Mobile: View, Edit, Delete with icons - aligned right */}
            <div className="flex items-center justify-end gap-2 pt-2 sm:hidden">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 hover:text-primary"
                onClick={() => onView(String(doc.id))}
              >
                <Eye className="h-3.5 w-3.5" />
                {t("common:buttons.view")}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 hover:text-primary"
                onClick={() => onEdit(String(doc.id))}
              >
                <Edit className="h-3.5 w-3.5" />
                {t("common:buttons.edit")}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 disabled:hover:bg-transparent"
                onClick={() => onDelete(doc.id)}
                disabled={isDeleting}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t("common:buttons.delete")}
              </button>
            </div>

            {/* Desktop: dropdown menu only */}
            <div className="hidden sm:block pt-1 border-t border-border/50">
              <div className="flex items-center justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-6 w-6 p-0 shrink-0"
                      aria-label={t("organization:card_view.more_actions")}
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onView(String(doc.id))}>
                      <Eye className="mr-2 h-4 w-4" /> {t("common:buttons.view")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(String(doc.id))}>
                      <Edit className="mr-2 h-4 w-4" /> {t("common:buttons.edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(doc.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> {t("common:buttons.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Desktop: entity badge */}
            {entityType && (
              <div className="hidden sm:flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="outline"
                  className={cn(
                    "font-medium text-[9px] px-1.5 py-0.5 h-4 capitalize",
                    entityId
                      ? "cursor-pointer hover:bg-accent"
                      : "opacity-50 cursor-not-allowed",
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
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
