import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { containerApi } from "../api/container.api";
import type {
  Container,
  ContainerListResponse,
} from "@/lib/zod/container.schema";


export type UseContainersParams = {
  page?: number;
  per_page?: number;
  container_number?: string;
  status?: string;
  container_size?: string;
  truck_type?: string;
  axle_type?: string;
  ship_id?: number;
};

/* ============== OVERLOADS ================= */

// LIST
export function useContainers(
  filters?: UseContainersParams,
  options?: { enabled?: boolean }
): ReturnType<typeof useQuery<ContainerListResponse>>;

// DETAILS
export function useContainers(
  id: number
): ReturnType<typeof useQuery<Container>>;

/* ============ IMPLEMENTATION ============== */

export function useContainers(
  arg?: UseContainersParams | number,
  options?: { enabled?: boolean }
) {
  // Always call hooks unconditionally - use enabled flag to control execution
  const isNumber = typeof arg === "number";
  
  const detailsQuery = useQuery<Container>({
    queryKey: ["container", arg],
    queryFn: () => containerApi.get(arg as number),
    enabled: isNumber && Number.isFinite(arg as number) && (options?.enabled !== false),
  });

  const listQuery = useQuery<ContainerListResponse>({
    queryKey: ["containers", arg],
    queryFn: () => containerApi.list((arg || {}) as UseContainersParams),
    placeholderData: keepPreviousData,
    enabled: !isNumber && (options?.enabled !== false),
  });

  // Return the appropriate query based on arg type
  return isNumber ? detailsQuery : listQuery;
}
