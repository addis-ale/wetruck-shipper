import { z } from "zod";
import { shipmentSchema, baseShipmentSchema } from "@/lib/zod/shipment.schema";

export type Shipment = z.infer<typeof shipmentSchema>;

export type CreateShipmentPayload = z.infer<typeof baseShipmentSchema>;

export type UpdateShipmentPayload = Partial<CreateShipmentPayload>;

// Query parameters for listing shipments
export interface ShipmentListParams {
  page?: number;
  per_page?: number;
  origin?: string;
  destination?: string;
  status?: string;
}
