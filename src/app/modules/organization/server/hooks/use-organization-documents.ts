import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  organizationApi,
  type OrganizationDocument,
} from "@/lib/api/organization";

export interface OrganizationDocumentWithUrl extends OrganizationDocument {
  presigned_url: string;
}

export function useOrganizationDocuments() {
  return useQuery({
    queryKey: ["organization-documents"],
    queryFn: async () => {
      const response = await organizationApi.listDocuments();
      if (!response.data) {
        throw new Error(response.error || "Failed to fetch documents");
      }
      // Filter out deleted documents
      return response.data.filter(
        (doc) => !doc.deleted
      ) as OrganizationDocument[];
    },
  });
}

export function useOrganizationDocument(id: string) {
  return useQuery({
    queryKey: ["organization-document", id],
    queryFn: async () => {
      const response = await organizationApi.getDocument(id);
      if (!response.data) {
        throw new Error(response.error || "Failed to fetch document");
      }
      return response.data as OrganizationDocumentWithUrl;
    },
    enabled: !!id,
  });
}

export function useUploadOrganizationDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      documentType,
    }: {
      file: File;
      documentType: string;
    }) => {
      const response = await organizationApi.uploadDocument(file, documentType);
      if (!response.data) {
        throw new Error(response.error || "Failed to upload document");
      }
      return response.data;
    },
    onMutate: async ({ documentType, file }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["organization-documents"],
      });

      // Snapshot the previous value
      const previousDocuments = queryClient.getQueryData<
        OrganizationDocument[]
      >(["organization-documents"]);

      // Optimistically update to the new value
      const optimisticDocument: OrganizationDocument = {
        id: Date.now(), // Temporary ID
        document_type: documentType,
        file_path: file.name,
        truck_id: null,
        driver_id: null,
        organization_id: undefined,
        entity_type: undefined,
        status: "pending",
        deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<OrganizationDocument[]>(
        ["organization-documents"],
        (old = []) => [optimisticDocument, ...old]
      );

      // Return a context object with the snapshotted value
      return { previousDocuments };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousDocuments) {
        queryClient.setQueryData(
          ["organization-documents"],
          context.previousDocuments
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({
        queryKey: ["organization-documents"],
      });
    },
  });
}

export function useUpdateOrganizationDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string | number;
      data: {
        document_type?: string;
        file?: File;
      };
    }) => {
      const response = await organizationApi.updateDocument(id, data);
      if (!response.data) {
        throw new Error(response.error || "Failed to update document");
      }
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["organization-documents"],
      });
      await queryClient.cancelQueries({
        queryKey: ["organization-document", String(id)],
      });

      // Snapshot the previous values
      const previousDocuments = queryClient.getQueryData<
        OrganizationDocument[]
      >(["organization-documents"]);
      const previousDocument =
        queryClient.getQueryData<OrganizationDocumentWithUrl>([
          "organization-document",
          String(id),
        ]);

      // Optimistically update the documents list
      queryClient.setQueryData<OrganizationDocument[]>(
        ["organization-documents"],
        (old = []) =>
          old.map((doc) =>
            doc.id === Number(id)
              ? {
                  ...doc,
                  document_type: data.document_type ?? doc.document_type,
                  updated_at: new Date().toISOString(),
                }
              : doc
          )
      );

      // Optimistically update the single document if it exists
      if (previousDocument) {
        queryClient.setQueryData<OrganizationDocumentWithUrl>(
          ["organization-document", String(id)],
          (old) =>
            old
              ? {
                  ...old,
                  document_type: data.document_type ?? old.document_type,
                  updated_at: new Date().toISOString(),
                }
              : old
        );
      }

      // Return a context object with the snapshotted values
      return { previousDocuments, previousDocument };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousDocuments) {
        queryClient.setQueryData(
          ["organization-documents"],
          context.previousDocuments
        );
      }
      if (context?.previousDocument) {
        queryClient.setQueryData(
          ["organization-document", String(variables.id)],
          context.previousDocument
        );
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: ["organization-documents"],
      });
      queryClient.invalidateQueries({
        queryKey: ["organization-document", String(variables.id)],
      });
    },
  });
}

export function useDeleteOrganizationDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      const response = await organizationApi.deleteDocument(id);
      if (!response.data) {
        throw new Error(response.error || "Failed to delete document");
      }
      return response.data;
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["organization-documents"],
      });
      await queryClient.cancelQueries({
        queryKey: ["organization-document", String(id)],
      });

      // Snapshot the previous value
      const previousDocuments = queryClient.getQueryData<
        OrganizationDocument[]
      >(["organization-documents"]);

      // Optimistically remove the document
      queryClient.setQueryData<OrganizationDocument[]>(
        ["organization-documents"],
        (old = []) => old.filter((doc) => doc.id !== Number(id))
      );

      // Return a context object with the snapshotted value
      return { previousDocuments };
    },
    onError: (err, id, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousDocuments) {
        queryClient.setQueryData(
          ["organization-documents"],
          context.previousDocuments
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({
        queryKey: ["organization-documents"],
      });
    },
  });
}
