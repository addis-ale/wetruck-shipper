import { useMutation, useQueryClient } from "@tanstack/react-query";
import { containerApi } from "../api/container.api";
import { CreateContainerInput } from "@/lib/zod/container.schema";
import type { Container } from "../types/container.types";

type UseCreateContainerOptions = {
  onSuccess?: (container: Container) => void;
};

export const useCreateContainer = (options?: UseCreateContainerOptions) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateContainerInput) => containerApi.create(payload),

    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["containers"] });
      qc.refetchQueries({
        queryKey: ["containers"],
        type: "active",
      });
      options?.onSuccess?.(data);
    },
  });
};
