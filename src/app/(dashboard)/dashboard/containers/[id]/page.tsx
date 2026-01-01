import { ContainerDetailsView } from "@/app/modules/container/ui/view/container-details-view";

type PageProps = {
  params: {
    id: string;
  };
};

export default function ContainerDetailsPage({ params }: PageProps) {
  return <ContainerDetailsView containerId={Number(params.id)} />;
}
