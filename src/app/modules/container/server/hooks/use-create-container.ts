import { useMutation, useQueryClient } from "@tanstack/react-query";
import { containerApi } from "../api/container.api";
import { CreateContainerInput } from "@/lib/zod/container.schema";

type UseCreateContainerOptions = {
  onSuccess?: () => void;
};

export const useCreateContainer = (
  options?: UseCreateContainerOptions
) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateContainerInput) =>
      containerApi.create(payload),

    onSuccess: () => {
      // Invalidate all container queries
      qc.invalidateQueries({ queryKey: ["containers"] });
      
      // Force refetch all active container queries
      // This bypasses staleTime: Infinity
      qc.refetchQueries({ 
        queryKey: ["containers"],
        type: "active"
      });
      
      options?.onSuccess?.();
    },
  });
};
