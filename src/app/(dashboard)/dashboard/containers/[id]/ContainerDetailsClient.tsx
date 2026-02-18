"use client";

import { useParams, useSearchParams } from "next/navigation";
import { ContainerDetailsView } from "@/app/modules/container/ui/view/container-details-view";

export default function ContainerDetailsClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const segmentId = params?.id as string | undefined;
  const queryId = searchParams?.get("id");
  const id = segmentId === "placeholder" ? queryId : segmentId;

  if (!id) {
    return (
      <div className="p-6">
        <p className="text-destructive">Invalid container ID: No ID provided</p>
      </div>
    );
  }

  const containerId = parseInt(id, 10);
  if (isNaN(containerId) || containerId <= 0) {
    return (
      <div className="p-6">
        <p className="text-destructive">
          Invalid container ID: &quot;{id}&quot; is not a valid number
        </p>
      </div>
    );
  }

  return <ContainerDetailsView containerId={containerId} />;
}
