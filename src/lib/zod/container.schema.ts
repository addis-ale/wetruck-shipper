import { z } from "zod";

/* ------------------------------------------------------------------
 * Enums
 * ------------------------------------------------------------------ */

export const containerSizeEnum = z.enum([
  "twenty_feet",
  "forty_feet",
]);

export const containerTypeEnum = z.enum([
  "dry",
  "reefer",
]);

export const weightUnitEnum = z.enum([
  "kg",
  "ton",
]);

export const containerStatusEnum = z.enum([
  "created",
  "assigned",
  "in_transit",
  "completed",
  "cancelled",
]);

/* ------------------------------------------------------------------
 * Nested Schemas
 * ------------------------------------------------------------------ */

export const containerDetailsSchema = z.object({
  commodity: z
    .array(z.string().min(1, "Commodity cannot be empty"))
    .min(1, "At least one commodity is required"),
  instruction: z.string().optional(),
});

export const returnLocationSchema = z.object({
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  port: z.string().min(1, "Port is required"),
  address: z.string().min(1, "Address is required"),
});

/* ------------------------------------------------------------------
 * Create Container Schema (POST payload)
 * ------------------------------------------------------------------ */

export const createContainerSchema = z.object({
  container_number: z.string().min(1, "Container number is required"),

  container_size: containerSizeEnum,
  container_type: containerTypeEnum,

  gross_weight: z.number().min(0),
  gross_weight_unit: weightUnitEnum,
  tare_weight: z.number().min(0),

  container_details: containerDetailsSchema,

  return_location_info: returnLocationSchema.optional(),

  sequencing_priority: z.number().int().min(1),

  is_returning: z.boolean(),
});

/* ------------------------------------------------------------------
 * Update Container Schema (PATCH payload)
 * ⚠️ Backend requires FULL payload → NOT partial
 * ------------------------------------------------------------------ */

export const updateContainerSchema = createContainerSchema;

/* ------------------------------------------------------------------
 * Container (API response model)
 * ------------------------------------------------------------------ */

export const containerSchema = createContainerSchema.extend({
  id: z.number(),

  status: containerStatusEnum,

  recommended_truck_type: z.string().nullable(),
  recommended_axle_type: z.string().nullable(),

  // 🔹 API may return null
  return_location_info: returnLocationSchema.nullable(),
});

/* ------------------------------------------------------------------
 * List Containers Response
 * ------------------------------------------------------------------ */

export const containerListSchema = z.object({
  items: z.array(containerSchema),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
});

/* ------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------ */

export type CreateContainerInput = z.infer<
  typeof createContainerSchema
>;

export type UpdateContainerInput = z.infer<
  typeof updateContainerSchema
>;

export type Container = z.infer<
  typeof containerSchema
>;

export type ContainerListResponse = z.infer<
  typeof containerListSchema
>;
