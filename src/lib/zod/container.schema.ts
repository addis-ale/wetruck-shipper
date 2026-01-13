import { z } from "zod";

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
  "price_requested",
  "assigned",
  "in_transit",
  "completed",
  "cancelled",
]);

export const containerDetailsSchema = z.object({
  commodity: z
    .array(z.string().min(1, "Commodity cannot be empty"))
    .min(1, "At least one commodity is required")
    .optional(), // Make optional for read operations
  instruction: z.string().optional(),
}).passthrough(); // Allow extra fields

export const returnLocationSchema = z.object({
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  port: z.string().min(1, "Port is required"),
  address: z.string().min(1, "Address is required"),
});

export const createContainerSchema = z.object({
  container_number: z.string().min(1, "Container number is required"),

  container_size: containerSizeEnum,
  container_type: containerTypeEnum,
  gross_weight: z.coerce.number().min(0),
  gross_weight_unit: weightUnitEnum.optional(), // Make optional for read operations
  tare_weight: z.coerce.number().min(0).optional(), // Make optional for read operations

  container_details: containerDetailsSchema.optional(), // Make optional for read operations

  return_location_info: returnLocationSchema.optional(),
  sequencing_priority: z.coerce.number().int().min(1).optional(), // Make optional for read operations

  is_returning: z.boolean().optional(), // Make optional for read operations
}).passthrough(); // Allow extra fields from backend


export const updateContainerSchema = createContainerSchema;


export const containerSchema = createContainerSchema.extend({
  id: z.number(),
  status: containerStatusEnum.optional(),
  recommended_truck_type: z.string().nullable().optional(),
  recommended_axle_type: z.string().nullable().optional(),
  return_location_info: returnLocationSchema.nullable().optional(),
  ship_id: z.number().nullable().optional(),
}).passthrough(); // Allow extra fields from backend


export const containerListSchema = z.object({
  items: z.array(containerSchema),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  pages: z.number().optional(),
  status: z.boolean().optional(),
  message: z.string().optional(),
});

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
