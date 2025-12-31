import { useQuery } from "@tanstack/react-query";
import { containerApi } from "../api/container.api";

export const useContainer = (id: number) => {
  return useQuery({
    queryKey: ["container", id],
    queryFn: () => containerApi.get(id),
    enabled: Number.isFinite(id) && id > 0,
    staleTime: 60_000, 
  });
};