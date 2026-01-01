import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { containerApi } from "../api/container.api";

export type UseContainersParams = {
  page?: number;
  per_page?: number;
  container_number?: string;
  status?: string;
  container_size?: string;
  truck_type?: string;
  axle_type?: string;
};

export const useContainers = (params: UseContainersParams) => {
  return useQuery({
    queryKey: ["containers", params],
    queryFn: () => containerApi.list(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
};
