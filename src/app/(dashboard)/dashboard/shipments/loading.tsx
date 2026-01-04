import { Skeleton } from "@/components/ui/skeleton";

export default function ShipmentsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[400px] w-full" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Skeleton className="h-[500px] w-full" />
        </div>
        <div>
          <Skeleton className="h-[500px] w-full" />
        </div>
      </div>
    </div>
  );
}

