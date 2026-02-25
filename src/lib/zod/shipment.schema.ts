import { z } from "zod";
import { containerSchema } from "./container.schema";

/* -------------------------------------------------------------------------- */
/* Enums                                                                       */
/* -------------------------------------------------------------------------- */

export const originDestinationEnum = z.enum([
  "addis_ababa",
  "adama",
  "dukem",
  "bishoftu",
  "debre_zeit",
  "hawassa",
  "shashemene",
  "djibouti",
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

/* -------------------------------------------------------------------------- */
/* Facility                                                                    */
/* -------------------------------------------------------------------------- */

export const facilitySchema = z.object({
  country: z.string(),
  region: z.string(),
  name: z.string(),
  address: z.string(),
  contact_name: z.string(),
  contact_phone_number: z.string(),
  contact_email: z.string().email().optional(),
});

/* -------------------------------------------------------------------------- */
/* Shipment Details (pickup & delivery REMOVED)                                */
/* -------------------------------------------------------------------------- */

export const shipmentDetailsSchema = z.object({
  bill_of_lading_number: z.string().max(100),
});

/* -------------------------------------------------------------------------- */
/* Base Shipment                                                               */
/* -------------------------------------------------------------------------- */

export const baseShipmentSchema = z.object({
  origin: originDestinationEnum,
  destination: originDestinationEnum,

  pickup_date: z.string(),
  delivery_date: z.string(),

  pickup_facility: facilitySchema.optional(),
  delivery_facility: facilitySchema.optional(),

  // ✅ ONLY bill_of_lading_number exists now
  shipment_details: shipmentDetailsSchema.optional(),

  status: shipmentStatusEnum.optional(),
});

/* -------------------------------------------------------------------------- */
/* Create Shipment                                                             */
/* -------------------------------------------------------------------------- */

export const createShipmentSchema = baseShipmentSchema.refine(
  (data) =>
    new Date(data.delivery_date).getTime() >
    new Date(data.pickup_date).getTime(),
  {
    message: "Delivery date must be after pickup date",
    path: ["delivery_date"],
  }
);

/* -------------------------------------------------------------------------- */
/* Update Shipment                                                             */
/* -------------------------------------------------------------------------- */

export const updateShipmentSchema = baseShipmentSchema.partial();

/* -------------------------------------------------------------------------- */
/* API Schemas                                                                 */
/* -------------------------------------------------------------------------- */

export const shipmentSchema = baseShipmentSchema.extend({
  id: z.number(),
  tracking_number: z.string().optional(),
  shipper_id: z.number(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const shipmentCreateResponseSchema = z.object({
  status: z.boolean(),
  error_message: z.string().nullable(),
  success_message: z.string().nullable(),
  result: shipmentSchema,
});

export const shipmentListResponseSchema = z.object({
  status: z.boolean(),
  message: z.string().optional(),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  pages: z.number(),
  items: z.array(shipmentSchema),
});

/* -------------------------------------------------------------------------- */
/* Ship Items                                                                  */
/* -------------------------------------------------------------------------- */

export const shipItemSchema = z
  .object({
    id: z.number(),
    ship_id: z.number(),
    transporter_id: z.number(),
    truck_id: z.number().nullable().optional(),
    driver_id: z.number().nullable().optional(),
    computed_price: z.number(),
    currency: z.string(),
    containers: z.array(containerSchema).default([]),
    deleted: z.boolean().optional(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .passthrough();

export const shipperShipItemsItemSchema = z.object({
  transporter_id: z.number(),
  ship_items: z.array(shipItemSchema),
  total_price: z.number(),
  total_containers: z.number(),
  currency: z.string(),
});

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type ShipperShipItemsItem = z.infer<
  typeof shipperShipItemsItemSchema
>;

export type CreateShipmentInput = z.infer<
  typeof createShipmentSchema
>;
export type UpdateShipmentInput = z.infer<
  typeof updateShipmentSchema
>;
export type Shipment = z.infer<typeof shipmentSchema>;
export type ShipmentCreateResponse = z.infer<
  typeof shipmentCreateResponseSchema
>;
export type ShipmentListResponse = z.infer<
  typeof shipmentListResponseSchema
>;
export type Facility = z.infer<typeof facilitySchema>;
export type ShipmentDetails = z.infer<typeof shipmentDetailsSchema>;
export type ShipItem = z.infer<typeof shipItemSchema>;
