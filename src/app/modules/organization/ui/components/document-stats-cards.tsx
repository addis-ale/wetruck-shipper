"use client";

import { FileText, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import type { OrganizationDocument } from "@/lib/api/organization";
import { useTranslation } from "react-i18next";

interface DocumentStatsCardsProps {
  documents: OrganizationDocument[];
}

export function DocumentStatsCards({ documents }: DocumentStatsCardsProps) {
  const { t } = useTranslation("organization");
  const total = documents.length;
  const pending = documents.filter((doc) => doc.status === "pending").length;
  const approved = documents.filter((doc) => doc.status === "approved").length;
  const rejected = documents.filter((doc) => doc.status === "rejected").length;

  const cardClass =
    "p-3 bg-card border border-border rounded-xl shadow-sm shrink-0 min-w-[calc(50%-0.25rem)] sm:min-w-0 sm:shrink lg:shrink";

  return (
    <div className="flex gap-2 overflow-x-auto overflow-y-hidden pb-2 scrollbar-hide sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-4 lg:gap-4">
      {/* Total Documents */}
      <div className={cardClass}>
        <div className="flex items-center justify-between">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2">
          <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider truncate">
            {t("organization:stats.total")}
          </h3>
          <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">
            {total}
          </p>
        </div>
      </div>

      {/* Pending */}
      <div className={cardClass}>
        <div className="flex items-center justify-between">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
            <Clock className="h-4 w-4" />
          </div>
          <span className="sm:hidden text-[9px] font-bold text-white bg-amber-500 px-2 py-0.5 rounded-full">
            {t("organization:stats.pending")}
          </span>
        </div>
        <div className="mt-2">
          <h3 className="text-[10px] font-bold text-amber-600 uppercase tracking-wider truncate">
            {t("organization:stats.pending")}
          </h3>
          <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">
            {pending}
          </p>
        </div>
      </div>

      {/* Approved */}
      <div className={cardClass}>
        <div className="flex items-center justify-between">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2">
          <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider truncate">
            {t("organization:stats.approved")}
          </h3>
          <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">
            {approved}
          </p>
        </div>
      </div>

      {/* Rejected */}
      <div className={cardClass}>
        <div className="flex items-center justify-between">
          <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
            <AlertCircle className="h-4 w-4" />
          </div>
          <span className="sm:hidden text-[9px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
            {t("organization:stats.rejected")}
          </span>
        </div>
        <div className="mt-2">
          <h3 className="text-[10px] font-bold text-red-600 uppercase tracking-wider truncate">
            {t("organization:stats.rejected")}
          </h3>
          <p className="text-xl sm:text-2xl font-bold text-red-500 mt-0.5">
            {rejected}
          </p>
        </div>
      </div>
    </div>
  );
}
