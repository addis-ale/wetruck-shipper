import { z } from "zod";
import { containerZod } from "@/lib/zod/container.schema";

/* ----------------------------------------
 * Core container type (from Zod)
 * ------------------------------------- */

export type Container = z.infer<typeof containerZod>;

/* ----------------------------------------
 * Payloads
 * ------------------------------------- */

/**
 * Payload used when creating a container
 * (fields controlled by backend are omitted)
 */
export type CreateContainerPayload = Omit<
  Container,
  | "id"
  | "status"
  | "recommended_truck_type"
  | "recommended_axle_type"
>;

/**
 * Payload used when updating a container
 */
export type UpdateContainerPayload = Partial<CreateContainerPayload>;
