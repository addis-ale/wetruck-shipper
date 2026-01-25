"use client";

import { FileText, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import type { OrganizationDocument } from "@/lib/api/organization";

interface DocumentStatsCardsProps {
  documents: OrganizationDocument[];
}

export function DocumentStatsCards({ documents }: DocumentStatsCardsProps) {
  const total = documents.length;
  const pending = documents.filter((doc) => doc.status === "pending").length;
  const approved = documents.filter((doc) => doc.status === "approved").length;
  const rejected = documents.filter((doc) => doc.status === "rejected").length;

  return (
    <div className="grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-4">
      <div className="p-2 sm:p-3 bg-primary/5 border border-primary/10 rounded-xl shadow-none">
        <div className="flex items-center justify-between">
          <div className="p-1 bg-primary/10 rounded-lg text-primary">
            <FileText className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-1.5 sm:mt-2">
          <h3 className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
            Total Documents
          </h3>
          <p className="text-lg sm:text-2xl font-bold text-primary">{total}</p>
        </div>
      </div>

      <div className="p-2 sm:p-3 bg-primary/5 border border-primary/10 rounded-xl shadow-none">
        <div className="flex items-center justify-between">
          <div className="p-1 bg-primary/10 rounded-lg text-primary">
            <Clock className="h-3.5 w-3.5" />
          </div>
          <span className="hidden sm:inline-block text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            Pending
          </span>
        </div>
        <div className="mt-1.5 sm:mt-2">
          <h3 className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
            Pending
          </h3>
          <p className="text-lg sm:text-2xl font-bold text-primary">
            {pending}
          </p>
        </div>
      </div>

      <div className="p-2 sm:p-3 bg-green-500/5 border border-green-500/10 rounded-xl shadow-none">
        <div className="flex items-center justify-between">
          <div className="p-1 bg-green-500/10 rounded-lg text-green-500">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </div>
          <span className="hidden sm:inline-block text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
            Approved
          </span>
        </div>
        <div className="mt-1.5 sm:mt-2">
          <h3 className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
            Approved
          </h3>
          <p className="text-lg sm:text-2xl font-bold text-green-500">
            {approved}
          </p>
        </div>
      </div>

      <div className="p-2 sm:p-3 bg-red-500/5 border border-red-500/10 rounded-xl shadow-none">
        <div className="flex items-center justify-between">
          <div className="p-1 bg-red-500/10 rounded-lg text-red-500">
            <AlertCircle className="h-3.5 w-3.5" />
          </div>
          <span className="hidden sm:inline-block text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
            Rejected
          </span>
        </div>
        <div className="mt-1.5 sm:mt-2">
          <h3 className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
            Rejected
          </h3>
          <p className="text-lg sm:text-2xl font-bold text-red-500">
            {rejected}
          </p>
        </div>
      </div>
    </div>
  );
}
