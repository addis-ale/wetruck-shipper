import ContainerDetailsClient from "./ContainerDetailsClient";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function ContainerDetailsPage() {
  return <ContainerDetailsClient />;
}
