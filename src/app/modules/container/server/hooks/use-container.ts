import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { containerApi } from "../api/container.api";
import type {
  Container,
  ContainerListResponse,
} from "@/lib/zod/container.schema";


export type UseContainersParams = {
  page: number;
  per_page: number;
  container_number?: string;
  status?: string;
  container_size?: string;
  truck_type?: string;
  axle_type?: string;
};

/* ============== OVERLOADS ================= */

// LIST
export function useContainers(
  filters: UseContainersParams
): ReturnType<typeof useQuery<ContainerListResponse>>;

// DETAILS
export function useContainers(
  id: number
): ReturnType<typeof useQuery<Container>>;

/* ============ IMPLEMENTATION ============== */

export function useContainers(
  arg: UseContainersParams | number
) {
  // DETAILS
  if (typeof arg === "number") {
    return useQuery<Container>({
      queryKey: ["container", arg],
      queryFn: () => containerApi.get(arg),
      enabled: Number.isFinite(arg),
    });
  }

  // LIST
  return useQuery<ContainerListResponse>({
    queryKey: ["containers", arg],
    queryFn: () => containerApi.list(arg),
    placeholderData: keepPreviousData,
  });
}
