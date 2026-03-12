"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import React from "react";
import { Upload, Search, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import {
  useOrganizationDocuments,
  useUploadOrganizationDocument,
  useUpdateOrganizationDocument,
  useDeleteOrganizationDocument,
  useOrganizationDocument,
} from "../../server/hooks";
import { organizationDocumentColumns } from "../columns/document-columns";
import type { OrganizationDocumentTableRow } from "../columns/document-columns";
import {
  UploadDocumentModal,
  EditDocumentModal,
  DeleteDocumentModal,
  DocumentStatsCards,
  DocumentFilterControls,
  DocumentCardView,
} from "../components";
import { toast } from "sonner";
import { organizationApi } from "@/lib/api/organization";
import { useDocumentPreviewContext } from "@/components/providers/DocumentPreviewProvider";
import { extToMimeType } from "@/lib/utils/document-utils";

export function OrganizationDocumentsView() {
  const router = useRouter();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);

  const { openDocument } = useDocumentPreviewContext();

  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [, setPageCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [, setIsSearchFocused] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter state
  const [filters, setFilters] = useState<{
    status?: "pending" | "approved" | "rejected" | null;
    document_type?:
      | "TRADE_LICENCE"
      | "AUTHORISED_CONTACT_PERSON_COMPANY_ID"
      | "OTHER"
      | null;
    entity_type?: "truck" | "driver" | null;
  }>({});

  const { data: documents, isLoading: documentsLoading } =
    useOrganizationDocuments();
  const uploadDocumentMutation = useUploadOrganizationDocument();
  const updateDocumentMutation = useUpdateOrganizationDocument();
  const deleteDocumentMutation = useDeleteOrganizationDocument();

  // Get selected document for editing
  const { data: selectedDocument } = useOrganizationDocument(
    selectedDocumentId || "",
  );

  const handleUploadDocument = async (file: File, documentType: string) => {
    // Close modal optimistically
    setIsUploadModalOpen(false);

    uploadDocumentMutation.mutate(
      {
        file,
        documentType,
      },
      {
        onSuccess: () => {
          toast.success("Document uploaded successfully");
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to upload document",
          );
        },
      },
    );
  };

  const handleUpdateDocument = async (
    id: string | number,
    data: { document_type?: string; file?: File },
  ) => {
    // Close modal optimistically
    setIsEditModalOpen(false);
    setSelectedDocumentId(null);

    updateDocumentMutation.mutate(
      { id, data },
      {
        onSuccess: () => {
          toast.success("Document updated successfully");
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to update document",
          );
        },
      },
    );
  };

  const handleDeleteDocument = (documentId: number) => {
    setDocumentToDelete(documentId);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (documentId: number) => {
    // Close modal optimistically
    setIsDeleteModalOpen(false);
    setDocumentToDelete(null);

    deleteDocumentMutation.mutate(documentId, {
      onSuccess: () => {
        toast.success("Document deleted successfully");
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete document",
        );
      },
    });
  };

  const handleViewDocument = async (id: string) => {
    try {
      // Always fetch a fresh presigned URL (bypass cache since URLs expire)
      const response = await organizationApi.getDocument(id);

      if (!response.data) {
        throw new Error(response.error || "Failed to fetch document");
      }

      if (response.data.presigned_url) {
        const fileName =
          response.data.file_path?.split("/").pop() ?? "document";
        openDocument(
          response.data.presigned_url,
          fileName,
          extToMimeType(response.data.file_ext) ?? undefined,
        );
      } else {
        toast.error("Document URL not available");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to view document",
      );
    }
  };

  const handleEditDocument = (id: string) => {
    setSelectedDocumentId(id);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedDocumentId(null);
  };

  const handleEntityClick = (entityType: string, entityId: number | null) => {
    if (!entityId) return;

    if (entityType === "truck") {
      router.push(`/fleet/${entityId}`);
    } else if (entityType === "driver") {
      // Navigate to driver detail page when it's available
      // For now, you can update this route when driver pages are implemented
      router.push(`/drivers/${entityId}`);
    }
  };

  // Filter handlers
  const handleStatusFilter = (
    status: "pending" | "approved" | "rejected" | "all" | null,
  ) => {
    setFilters((prev) => ({
      ...prev,
      status: status === "all" ? null : status,
    }));
    setPage(1);
  };

  const handleDocumentTypeFilter = (
    type:
      | "TRADE_LICENCE"
      | "AUTHORISED_CONTACT_PERSON_COMPANY_ID"
      | "OTHER"
      | "all"
      | null,
  ) => {
    setFilters((prev) => ({
      ...prev,
      document_type: type === "all" ? null : type,
    }));
    setPage(1);
  };

  const handleEntityTypeFilter = (type: "truck" | "driver" | "all" | null) => {
    setFilters((prev) => ({
      ...prev,
      entity_type: type === "all" ? null : type,
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
  };

  // Filter documents based on active filters and search term
  const filteredDocuments = (documents || []).filter((doc) => {
    if (filters.status && doc.status !== filters.status) return false;
    // Compare case-insensitively since backend may return lowercase
    if (
      filters.document_type &&
      doc.document_type?.toLowerCase() !== filters.document_type.toLowerCase()
    )
      return false;
    if (filters.entity_type && doc.entity_type !== filters.entity_type)
      return false;
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const docType = doc.document_type?.toLowerCase() || "";
      if (!docType.includes(searchLower)) return false;
    }
    return true;
  });

  // Reset scroll state when filters, search, or page change
  useEffect(() => {
    setIsScrolled(false);
  }, [filters, searchTerm, page]);

  // Update page count when filtered documents change
  useEffect(() => {
    const totalPages = Math.ceil(filteredDocuments.length / perPage);
    setPageCount(totalPages);
  }, [filteredDocuments.length, perPage]);

  return (
    <div className="flex flex-col space-y-3 sm:space-y-4 animate-in fade-in duration-500 w-full overflow-x-hidden min-h-0">
      {/* Breadcrumb - desktop only */}
      <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground shrink-0">
        <button
          onClick={() => router.push("/dashboard")}
          className="hover:text-foreground transition-colors"
        >
          Dashboard
        </button>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">
          Organization Documents
        </span>
      </div>

      {/* Header: mobile = "Documents" only, desktop = title + subtitle */}
      <div className="space-y-3 pb-2 border-b shrink-0 touch-none md:touch-auto">
        <div className="flex flex-row items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-xl font-bold tracking-tight text-primary">
              <span className="sm:hidden">Documents</span>
              <span className="hidden sm:inline">Organization Documents</span>
            </h2>
            <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground">
              Upload and manage organization-related documents securely
            </p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex flex-col gap-3 mb-2 sm:mb-4 shrink-0">
        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary sm:text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by document type..."
                className="pl-9 h-10 sm:h-9 rounded-lg bg-muted/50 sm:bg-background focus-visible:ring-0 focus-visible:ring-offset-0 border-border"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
            </div>
          </div>
          <Button
            onClick={() => setIsUploadModalOpen(true)}
            className="hidden sm:flex h-9 text-xs bg-primary hover:bg-primary/90 text-white shrink-0"
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Upload Document
          </Button>
        </div>
        <DocumentFilterControls
          filters={filters}
          onStatusFilter={handleStatusFilter}
          onDocumentTypeFilter={handleDocumentTypeFilter}
          onEntityTypeFilter={handleEntityTypeFilter}
          onClearFilters={clearFilters}
        />
      </div>

      {/* Stats Cards - always visible on mobile */}
      <div className="shrink-0 touch-none md:touch-auto">
        <DocumentStatsCards documents={filteredDocuments} />
      </div>

      {/* Main Content - Table and Cards */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        {/* Desktop Table View */}
        <div className="hidden sm:block flex-1 min-h-0 overflow-y-auto">
          <DataTable
            columns={organizationDocumentColumns(
              handleViewDocument,
              handleEditDocument,
              handleDeleteDocument,
              deleteDocumentMutation.isPending,
              handleEntityClick,
            )}
            data={filteredDocuments as OrganizationDocumentTableRow[]}
            searchKey={undefined}
            searchPlaceholder=""
            manualPagination={true}
            page={page}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(newPerPage: number) => {
              setPerPage(newPerPage);
              setPage(1);
            }}
            onScrollChange={setIsScrolled}
            isScrolled={isScrolled}
            onPageCountChange={setPageCount}
            onSearchFocus={setIsSearchFocused}
            isLoading={documentsLoading}
            filterControls={null}
            headerActions={null}
            mobileAddButton={null}
          />
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden flex-1 min-h-0 overflow-auto">
          {documentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <DocumentCardView
              documents={filteredDocuments}
              onView={handleViewDocument}
              onEdit={handleEditDocument}
              onDelete={handleDeleteDocument}
              onEntityClick={handleEntityClick}
              isDeleting={deleteDocumentMutation.isPending}
            />
          )}
        </div>
      </div>

      {/* Mobile FAB - Upload */}
      <Button
        onClick={() => setIsUploadModalOpen(true)}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] right-4 z-30 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg sm:hidden flex items-center justify-center p-0"
        aria-label="Upload document"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Upload Document Modal */}
      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        onUpload={handleUploadDocument}
        isUploading={uploadDocumentMutation.isPending}
      />

      {/* Edit Document Modal */}
      <EditDocumentModal
        isOpen={isEditModalOpen}
        onOpenChange={handleCloseEditModal}
        document={selectedDocument || null}
        onUpdate={handleUpdateDocument}
        isUpdating={updateDocumentMutation.isPending}
      />

      {/* Delete Document Modal */}
      <DeleteDocumentModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        document={
          documentToDelete
            ? documents?.find((doc) => doc.id === documentToDelete) || null
            : null
        }
        onDelete={handleConfirmDelete}
        isDeleting={deleteDocumentMutation.isPending}
      />
    </div>
  );
}
