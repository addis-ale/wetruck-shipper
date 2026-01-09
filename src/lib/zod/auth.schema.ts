import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    code: z.string().min(4, "OTP is required"),
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });
