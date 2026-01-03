import { request } from "@/lib/api-client";

export async function requestPasswordReset(email: string) {
  return request<string>("/auth/password-reset/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function confirmPasswordReset(
  code: string,
  new_password: string
) {
  return request<string>("/auth/password-reset/confirm", {
    method: "POST",
    body: JSON.stringify({
      code,
      new_password,
    }),
  });
}
