import type {
  Shipment,
  CreateShipmentPayload,
  UpdateShipmentPayload,
} from "@/app/modules/shipment/server/types/shipment.types";
import type {
  ShipmentListResponse,
  ShipmentCreateResponse,
  ShipItemsListResponse,
  TransporterShipment,
  ShipperShipItemsListResponse,
  ShipItem,
} from "@/lib/zod/shipment.schema";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const API_PREFIX = "/api/v1";
const API_PATH = "/ship";

// Helper to get auth token from localStorage or cookies
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  // First try localStorage (most reliable for cross-origin requests)
  const localStorageToken = localStorage.getItem("wetruck_access_token");
  if (localStorageToken) {
    return localStorageToken;
  }

  // Fallback to cookie
  if (typeof document !== "undefined") {
    const cookies = document.cookie.split(";");
    const tokenCookie = cookies.find((c) =>
      c.trim().startsWith("access_token=")
    );
    if (tokenCookie) {
      return tokenCookie.split("=")[1];
    }
  }

  return null;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Add Authorization header if token is available (as fallback if cookies fail)
  // Many backends accept both cookie-based and header-based auth
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Construct full URL, ensuring we don't double up /api/v1
  const baseUrl = BASE_URL.replace(/\/api\/v1\/?$/, ""); // Remove /api/v1 if present
  const fullUrl = `${baseUrl}${API_PREFIX}${endpoint}`;

  // Debug logging in development
  if (process.env.NODE_ENV === "development") {
    console.log(`📡 API Request: ${options.method || "GET"} ${fullUrl}`);
  }

  const response = await fetch(fullUrl, {
    ...options,
    headers,
    credentials: "include", // CRITICAL: This sends cookies (including HttpOnly cookies)
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // If response is not JSON, use status text
    }

    // Handle FastAPI validation errors
    if (errorData.detail) {
      if (Array.isArray(errorData.detail)) {
        const firstError = errorData.detail[0];
        throw new Error(
          firstError.msg || firstError.message || "Validation error"
        );
      } else if (typeof errorData.detail === "string") {
        throw new Error(errorData.detail);
      } else if (errorData.detail.message) {
        // Handle custom exception format
        throw new Error(errorData.detail.message);
      }
    }

    // Check for error message in various formats
    const errorMessage =
      errorData.message ||
      errorData.error_message ||
      errorData.detail?.message ||
      errorData.detail ||
      `HTTP ${response.status}: ${response.statusText}`;

    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const shipmentApi = {
  // Get all shipments with pagination and filters
  async getAll(params?: {
    page?: number;
    per_page?: number;
    origin?: string;
    destination?: string;
    status?: string;
  }): Promise<ShipmentListResponse> {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.per_page)
      searchParams.append("per_page", params.per_page.toString());
    if (params?.origin) searchParams.append("origin", params.origin);
    if (params?.destination)
      searchParams.append("destination", params.destination);
    if (params?.status) searchParams.append("status", params.status);

    const query = searchParams.toString();
    const endpoint = query ? `${API_PATH}/?${query}` : `${API_PATH}/`;

    return apiRequest<ShipmentListResponse>(endpoint);
  },

  // Get single shipment by ID
  async getById(id: number): Promise<Shipment> {
    return apiRequest<Shipment>(`${API_PATH}/${id}`);
  },

  // Create shipment
  async create(data: CreateShipmentPayload): Promise<Shipment> {
    const response = await apiRequest<ShipmentCreateResponse>(`${API_PATH}/`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    return response.result;
  },

  // Update shipment (PATCH)
  async update(id: number, data: UpdateShipmentPayload): Promise<Shipment> {
    const response = await apiRequest<ShipmentCreateResponse>(
      `${API_PATH}/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );

    return response.result;
  },

  // Delete shipment
  async delete(id: number): Promise<void> {
    await apiRequest<void>(`${API_PATH}/${id}`, {
      method: "DELETE",
    });
  },

  // Assign containers to shipment (bulk)
  async assignContainers(
    shipmentId: number,
    containerIds: number[]
  ): Promise<void> {
    if (!containerIds || containerIds.length === 0) {
      throw new Error("At least one container ID is required");
    }

    await apiRequest<{ status: boolean; success_message: string }>(
      `${API_PATH}/${shipmentId}/containers`,
      {
        method: "POST",
        body: JSON.stringify({ container_ids: containerIds }),
      }
    );
  },

  // Remove container from shipment
  async removeContainer(
    shipmentId: number,
    containerId: number
  ): Promise<void> {
    await apiRequest<void>(
      `${API_PATH}/${shipmentId}/containers/${containerId}`,
      {
        method: "DELETE",
      }
    );
  },

  // Get price for selected containers
  async getPrice(
    shipmentId: number,
    containerIds: number[]
  ): Promise<{ price: number; currency?: string }> {
    // TODO: Replace with actual API endpoint when available
    // Example: POST /api/v1/ship/{shipmentId}/price
    // Body: { container_ids: [1, 2, 3] }

    return apiRequest<{ price: number; currency?: string }>(
      `${API_PATH}/${shipmentId}/price`,
      {
        method: "POST",
        body: JSON.stringify({ container_ids: containerIds }),
      }
    );
  },

  // Request price for a shipment
  async requestPrice(shipmentId: number): Promise<{
    status: boolean;
    error_message: string | null;
    success_message: string | null;
    result: string;
  }> {
    // Note: The endpoint has /ship/ship/ (double "ship") as per API spec
    // Full path: /api/v1/ship/ship/{shipmentId}/price-request
    const endpoint = `${API_PATH}/ship/${shipmentId}/price-request`;

    if (process.env.NODE_ENV === "development") {
      const baseUrl = BASE_URL.replace(/\/api\/v1\/?$/, "");
      console.log(
        "🔗 Request Price Endpoint:",
        `${baseUrl}${API_PREFIX}${endpoint}`
      );
    }

    return apiRequest<{
      status: boolean;
      error_message: string | null;
      success_message: string | null;
      result: string;
    }>(endpoint, {
      method: "POST",
    });
  },

  // Get ship items (priced items)
  async getShipItems(params?: {
    page?: number;
    per_page?: number;
    ship_id?: number;
    transporter_id?: number;
    status?: "created" | "accepted_by_shipper" | "rejected_by_shipper";
  }): Promise<ShipItemsListResponse> {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.per_page)
      searchParams.append("per_page", params.per_page.toString());
    if (params?.ship_id)
      searchParams.append("ship_id", params.ship_id.toString());
    if (params?.transporter_id)
      searchParams.append("transporter_id", params.transporter_id.toString());
    if (params?.status) searchParams.append("status", params.status);

    const query = searchParams.toString();
    const endpoint = query ? `/ship-item/?${query}` : `/ship-item/`;

    return apiRequest<ShipItemsListResponse>(endpoint);
  },

  // Get ship by transporter (includes ship_items and containers)
  async getByTransporter(shipId: number): Promise<TransporterShipment> {
    return apiRequest<TransporterShipment>(`/ship/transporter/${shipId}`);
  },

  // Get ship items for shipper (grouped by transporter)
  async getShipItemsForShipper(params?: {
    page?: number;
    per_page?: number;
    ship_id?: number;
  }): Promise<ShipperShipItemsListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.per_page) searchParams.append("per_page", params.per_page.toString());
    if (params?.ship_id) searchParams.append("ship_id", params.ship_id.toString());
    
    const query = searchParams.toString();
    const endpoint = query ? `/ship-item/shipper?${query}` : "/ship-item/shipper";
    return apiRequest<ShipperShipItemsListResponse>(endpoint);
  },

  // Get accepted ship items for a specific shipment
  async getAcceptedShipItems(shipId: number): Promise<ShipItem[]> {
    return apiRequest<ShipItem[]>(`${API_PATH}/${shipId}/list-accepted-ship-items`);
  },

  // Get single ship item by ID for shipper (with full container details)
  async getShipItemByIdForShipper(shipItemId: number): Promise<ShipItem> {
    return apiRequest<ShipItem>(`/ship-item/${shipItemId}/shipper`);
  },

  // Accept a transporter's quote for a shipment (old endpoint - kept for backward compatibility)
  async acceptShipItem(shipItemId: number): Promise<{
    status: boolean;
    message: string;
  }> {
    return apiRequest<{
      status: boolean;
      message: string;
    }>(`/ship-item/${shipItemId}/accept`, {
      method: "POST",
    });
  },

  // Accept a shipment by selecting ship items
  async acceptShip(shipId: number, shipItemIds: number[]): Promise<{
    status: boolean;
    error_message: string | null;
    success_message: string | null;
    result: string;
  }> {
    return apiRequest<{
      status: boolean;
      error_message: string | null;
      success_message: string | null;
      result: string;
    }>(`/ship/ship/${shipId}/accept-ship`, {
      method: "POST",
      body: JSON.stringify({ ship_item_ids: shipItemIds }),
    });
  },
};
