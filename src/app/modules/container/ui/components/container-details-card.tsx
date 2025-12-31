import { Container } from "../../server/types/container.types";

export function ContainerDetailsCard({ container }: { container: Container }) {
  return (
    <div className="rounded border p-4 space-y-2">
      <p><b>Number:</b> {container.container_number}</p>
      <p><b>Size:</b> {container.container_size}</p>
      <p><b>Type:</b> {container.container_type}</p>
    </div>
  );
}
