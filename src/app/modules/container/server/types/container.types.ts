import { z } from "zod";
import { containerSchema } from "@/lib/zod/container.schema";

export type Container = z.infer<typeof containerSchema>;

export type CreateContainerPayload = Omit<
  Container,
  | "id"
  | "status"
  | "recommended_truck_type"
  | "recommended_axle_type"
>;

export type UpdateContainerPayload = Partial<CreateContainerPayload>;
