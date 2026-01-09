import { useMutation } from "@tanstack/react-query";
import { confirmPasswordReset } from "../api/auth.api";

export function useConfirmPasswordReset() {
  return useMutation({
    mutationFn: ({
      code,
      new_password,
    }: {
      code: string;
      new_password: string;
    }) => confirmPasswordReset(code, new_password),
  });
}
