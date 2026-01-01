import { useMutation, useQueryClient } from "@tanstack/react-query";
import { containerApi } from "../api/container.api";
import { UpdateContainerInput } from "@/lib/zod/container.schema";

type UpdatePayload = {
  id: number;
  data: UpdateContainerInput;
};

export const useUpdateContainer = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdatePayload) => containerApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["containers"] });
      qc.invalidateQueries({ queryKey: ["container"] });
    },
  });
};