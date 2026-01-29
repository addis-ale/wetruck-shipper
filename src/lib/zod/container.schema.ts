import { z } from "zod";
import { COUNTRIES } from "@/lib/constants/locations";

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
  "priced",
  "accepted_by_shipper",
  "rejected_by_shipper",
  "allocated",
  "ready_for_pickup",
  "in_transit",
  "delivered",
  "completed",
  "cancelled",
  "assigned",
]);

export const truckTypeEnum = z.enum([
  "flatbed",
  "trailer",
]);

export const countryEnum = z.enum(
  COUNTRIES.map((c) => c.code.toLowerCase()) as [string, ...string[]]
);

export const containerDetailsSchema = z
  .object({
    commodity: z
      .array(z.string().trim().min(1))
      .min(1, "At least one commodity is required"),
    instruction: z.string().trim().min(1),
  })
  .passthrough();

export const returnLocationCreateSchema = z
  .object({
    country: countryEnum,
    city: z.string().trim().min(2),
    port: z.string().trim().min(2).optional(),
    address: z.string().trim().min(5),
  })
  .superRefine((val, ctx) => {
    if (val.country === "dj" && !val.port) {
      ctx.addIssue({
        path: ["port"],
        code: z.ZodIssueCode.custom,
        message: "Port is required when country is Djibouti",
      });
    }
  });

/* ================= BASE (NO REFINEMENTS) ================= */

const containerBaseSchema = z.object({
  container_number: z.string().trim().min(1),

  container_size: containerSizeEnum,
  container_type: containerTypeEnum,

  gross_weight: z.coerce.number().gt(0),
  gross_weight_unit: weightUnitEnum,
  tare_weight: z.coerce.number().gt(0).optional(),

  container_details: containerDetailsSchema.nullable().optional(),
  return_location_info: returnLocationCreateSchema.optional(),

  sequencing_priority: z
    .union([z.coerce.number().int().min(1).max(10), z.null()])
    .optional(),

  recommended_truck_type: truckTypeEnum.optional(),
  is_returning: z.boolean(),
});

export const createContainerSchema = containerBaseSchema
  .superRefine((val, ctx) => {
    if (
      val.tare_weight !== undefined &&
      val.tare_weight >= val.gross_weight
    ) {
      ctx.addIssue({
        path: ["tare_weight"],
        code: z.ZodIssueCode.custom,
        message: "tare_weight must be less than gross_weight",
      });
    }

    if (val.is_returning && !val.return_location_info) {
      ctx.addIssue({
        path: ["return_location_info"],
        code: z.ZodIssueCode.custom,
        message: "Return location is required when container is returning",
      });
    }
  })
  .passthrough();


export const updateContainerSchema = containerBaseSchema
  .partial()
  .superRefine((val, ctx) => {
    if (
      val.gross_weight !== undefined &&
      val.tare_weight !== undefined &&
      val.tare_weight >= val.gross_weight
    ) {
      ctx.addIssue({
        path: ["tare_weight"],
        code: z.ZodIssueCode.custom,
        message: "tare_weight must be less than gross_weight",
      });
    }
  })
  .passthrough();


export const returnLocationResponseSchema = z.object({
  country: z.string(),           
  city: z.string(),
  port: z.string().nullable().optional(), 
  address: z.string(),
});

export const containerSchema = containerBaseSchema.extend({
  id: z.number(),
  status: containerStatusEnum.optional(),
  recommended_truck_type: z.string().nullable().optional(),
  recommended_axle_type: z.string().nullable().optional(),
  return_location_info: returnLocationResponseSchema.nullable().optional(),
  ship_id: z.number().nullable().optional(),
}).passthrough();

export const containerListSchema = z.object({
  items: z.array(containerSchema),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  pages: z.number().optional(),
  status: z.boolean().optional(),
  message: z.string().optional(),
});

export type CreateContainerInput = z.infer<typeof createContainerSchema>;
export type UpdateContainerInput = z.infer<typeof updateContainerSchema>;
export type Container = z.infer<typeof containerSchema>;
export type ContainerListResponse = z.infer<typeof containerListSchema>;
