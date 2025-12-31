import { useMutation, useQueryClient } from "@tanstack/react-query";
import { containerApi } from "../api/container.api";

type UseDeleteContainerOptions = {
  onSuccess?: () => void;
};

export const useDeleteContainer = (
  options?: UseDeleteContainerOptions
) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => containerApi.delete(id),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["containers"] });

      const previous = qc.getQueryData<any>(["containers"]);

      qc.setQueryData(["containers"], (old: any) => {
        if (!old?.items) return old;

        return {
          ...old,
          items: old.items.filter((c: any) => c.id !== id),
          total: old.total - 1,
        };
      });

      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(["containers"], ctx.previous);
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["containers"] });
      options?.onSuccess?.();
    },
  });
};
