import { z } from "zod";

// Enums
export const originDestinationEnum = z.enum([
  "addis_ababa",
  "adama",
  "dukem",
  "debre_zeit",
  "hawassa",
  "shashemene",
  "djibouti_port",
]);

export const shipmentStatusEnum = z.enum([
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
]);

// Facility schema
export const facilitySchema = z.object({
  country: z.string().min(1, "Country is required"),
  region: z.string().min(1, "Region is required"),
  name: z.string().min(1, "Facility name is required"),
  address: z.string().min(1, "Address is required"),
  contact_name: z.string().min(1, "Contact name is required"),
  contact_phone_number: z.string().min(1, "Phone number is required"),
  contact_email: z.string().email("Invalid email format"),
});

// Shipment details schema
export const shipmentDetailsSchema = z.object({
  bill_of_lading_number: z.string().min(1, "Bill of lading number is required"),
  pickup_number: z.string().min(1, "Pickup number is required"),
  delivery_number: z.string().min(1, "Delivery number is required"),
});

// Base shipment schema (without refinement)
const baseShipmentSchema = z.object({
  origin: originDestinationEnum,
  destination: originDestinationEnum,
  pickup_date: z.string().min(1, "Pickup date is required"),
  delivery_date: z.string().min(1, "Delivery date is required"),
  pickup_facility: facilitySchema,
  delivery_facility: facilitySchema,
  shipment_details: shipmentDetailsSchema,
  status: shipmentStatusEnum.default("created"),
});

// Create shipment schema (with date validation)
export const createShipmentSchema = baseShipmentSchema.refine(
  (data) => new Date(data.delivery_date) > new Date(data.pickup_date),
  {
    message: "Delivery date must be after pickup date",
    path: ["delivery_date"],
  }
);

// Update shipment schema
export const updateShipmentSchema = baseShipmentSchema.partial();

// Full shipment schema (with ID and assigned containers)
export const shipmentSchema = baseShipmentSchema.extend({
  id: z.number(),
  shipper_id: z.number().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// API Response schemas
export const shipmentListResponseSchema = z.object({
  status: z.boolean(),
  message: z.string().optional(),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  pages: z.number(),
  items: z.array(shipmentSchema),
});

export const shipmentCreateResponseSchema = z.object({
  status: z.boolean(),
  error_message: z.string().nullable(),
  success_message: z.string().nullable(),
  result: shipmentSchema,
});

// Types
export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>;
export type Shipment = z.infer<typeof shipmentSchema>;
export type ShipmentListResponse = z.infer<typeof shipmentListResponseSchema>;
export type ShipmentCreateResponse = z.infer<typeof shipmentCreateResponseSchema>;
export type Facility = z.infer<typeof facilitySchema>;
export type ShipmentDetails = z.infer<typeof shipmentDetailsSchema>;

