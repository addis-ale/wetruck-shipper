import { useQuery, keepPreviousData, UseQueryOptions } from "@tanstack/react-query";
import { containerApi } from "../api/container.api";

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

type ContainerListResponse = Awaited<ReturnType<typeof containerApi.list>>;

export const useContainers = (
  params?: UseContainersParams,
  options?: Omit<UseQueryOptions<ContainerListResponse>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: ["containers", params],
    queryFn: () => containerApi.list(params || {}),
    placeholderData: keepPreviousData,
    staleTime: Infinity, // Never auto-refetch
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    ...options,
  });
};
