import { Container } from "../../server/types/container.types";

export function ContainerReturnInfo({ container }: { container: Container }) {
  if (!container.is_returning || !container.return_location_info) return null;

  const info = container.return_location_info;

  return (
    <div className="text-sm">
      Return to: {info.city}, {info.country}
    </div>
  );
}
