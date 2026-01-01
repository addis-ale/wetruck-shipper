import { OrganizationDocumentsView } from "@/app/modules/organization/ui/views/organization-documents-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Organization Documents | WeTruck",
  description: "Upload and manage organization-related documents securely.",
};

export default function OrganizationDocumentsPage() {
  return <OrganizationDocumentsView />;
}
