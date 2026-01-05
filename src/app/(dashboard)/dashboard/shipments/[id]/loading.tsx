import { Skeleton } from "@/components/ui/skeleton";

export default function ShipmentDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-[400px] w-full" />
      <Skeleton className="h-[500px] w-full" />
    </div>
  );
}

