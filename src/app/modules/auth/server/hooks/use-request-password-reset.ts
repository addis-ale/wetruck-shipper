import { useMutation } from "@tanstack/react-query";
import { requestPasswordReset } from "../api/auth.api";

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
  });
}
