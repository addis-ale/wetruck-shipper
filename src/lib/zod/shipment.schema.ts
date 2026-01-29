import { z } from "zod";
import { containerSchema } from "./container.schema";

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
  pickup_number: z.string().optional(),
  delivery_number: z.string().optional(),
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

export const shipItemSchema = z.object({
  id: z.number(),
  ship_id: z.number(),
  truck_id: z.number().optional().nullable(),
  driver_id: z.number().optional().nullable(),
  transporter_id: z.number(),
  containers: z.array(containerSchema).default([]), 
  computed_price: z.number(),
  currency: z.string(),
  deleted: z.boolean().optional(),
  created_at: z.string(),
  updated_at: z.string(),
}).passthrough(); 

export const shipItemsListResponseSchema = z.object({
  status: z.boolean(),
  message: z.string().optional(),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  pages: z.number(),
  items: z.array(shipItemSchema),
});

export const transporterShipmentSchema = shipmentSchema.extend({
  ship_items: z.array(shipItemSchema).default([]),
  containers: z.array(z.any()).default([]), 
}).passthrough(); 

export const shipperShipItemsItemSchema = z.object({
  transporter_id: z.number(),
  ship_items: z.array(shipItemSchema).default([]),
  total_price: z.number(),
  total_containers: z.number(),
  currency: z.string(),
}).passthrough();

export const shipperShipItemsListResponseSchema = z.object({
  status: z.boolean(),
  message: z.string().optional(),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  pages: z.number(),
  items: z.array(shipperShipItemsItemSchema),
});

// Types
export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>;
export type Shipment = z.infer<typeof shipmentSchema>;
export type ShipmentListResponse = z.infer<typeof shipmentListResponseSchema>;
export type ShipmentCreateResponse = z.infer<typeof shipmentCreateResponseSchema>;
export type Facility = z.infer<typeof facilitySchema>;
export type ShipmentDetails = z.infer<typeof shipmentDetailsSchema>;
export type ShipItem = z.infer<typeof shipItemSchema>;
export type ShipItemsListResponse = z.infer<typeof shipItemsListResponseSchema>;
export type TransporterShipment = z.infer<typeof transporterShipmentSchema>;
export type ShipperShipItemsItem = z.infer<typeof shipperShipItemsItemSchema>;
export type ShipperShipItemsListResponse = z.infer<typeof shipperShipItemsListResponseSchema>;

