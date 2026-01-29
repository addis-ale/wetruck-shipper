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
    let errorData: { 
      detail?: unknown; 
      errors?: Array<{ type?: string; loc?: (string | number)[]; msg?: string; input?: unknown; ctx?: Record<string, unknown> }>;
      message?: string; 
      error_message?: string;
      error?: string;
      code?: string;
      status_code?: number;
    } = {};
    
    let responseText = "";
    try {
      responseText = await response.text();
      // Debug logging in development
      if (process.env.NODE_ENV === "development") {
        console.error("❌ API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          body: responseText,
        });
      }
      // Try to parse as JSON
      if (responseText) {
        try {
          errorData = JSON.parse(responseText);
        } catch {
          // If not JSON, we'll use the text as fallback below
        }
      }
    } catch {
      // If we couldn't read the response, use status text
      responseText = `${response.status}: ${response.statusText}`;
    }

    // Handle custom error format with 'error' and 'code' fields (e.g., MISSING_DOCUMENTS)
    if (errorData.error) {
      let errorMessage = errorData.error;
      
      // Handle specific error codes with user-friendly messages
      if (errorData.code === "MISSING_DOCUMENTS") {
        // Extract document names from the error message
        // Format: "One or more required documents (Trade License, Authorized Contact Person Company ID) are missing or not approved."
        const docMatch = errorMessage.match(/\(([^)]+)\)/);
        if (docMatch && docMatch[1]) {
          const documents = docMatch[1].split(",").map(doc => doc.trim());
          if (documents.length === 1) {
            errorMessage = `Please upload the required document: ${documents[0]}`;
          } else {
            const lastDoc = documents.pop();
            const docList = documents.join(", ") + ", and " + lastDoc;
            errorMessage = `Please upload the following required documents: ${docList}`;
          }
        } else {
          // Fallback if we can't parse the document names
          errorMessage = "Please upload all required documents. Some documents are missing or not approved.";
        }
      } else if (errorData.code === "DOCUMENT_NOT_APPROVED") {
        errorMessage = "One or more documents are pending approval. Please wait for approval or upload new documents.";
      } else if (errorData.code === "INVALID_DOCUMENT") {
        errorMessage = "One or more documents are invalid. Please check and upload valid documents.";
      }
      
      throw new Error(errorMessage);
    }

    // Handle FastAPI validation errors with errors array format
    if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
      const formattedErrors = errorData.errors.map((err) => {
        let field = "field";
        if (err.loc && Array.isArray(err.loc)) {
          // Filter out "body" and numeric indices, keep only meaningful field names
          const meaningfulFields = err.loc.filter(
            (item) => typeof item === "string" && item !== "body"
          );
          if (meaningfulFields.length > 0) {
            field = meaningfulFields.join(".");
          } else if (err.loc.length > 0) {
            // Fallback to last element if no meaningful fields found
            const lastItem = err.loc[err.loc.length - 1];
            field = typeof lastItem === "string" ? lastItem : String(lastItem);
          }
        }
        
        // Format field name to be more readable
        const readableField = String(field)
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
        
        // Use the error message if available, otherwise create a generic one
        if (err.msg) {
          // Make error messages more user-friendly
          let message = err.msg;
          
          // Handle enum errors with better formatting
          if (err.type === "enum" && err.ctx?.expected) {
            const expected = String(err.ctx.expected);
            // Clean up the expected values - remove quotes and format nicely
            const cleanExpected = expected
              .replace(/'/g, "")
              .replace(/"/g, "")
              .split(" or ")
              .join(", ");
            message = `${readableField} must be one of: ${cleanExpected}`;
          } else if (err.type === "missing" || err.type === "value_error.missing") {
            message = `${readableField} is required`;
          } else if (err.type === "type_error" || err.type?.includes("type")) {
            message = `${readableField} has an invalid format`;
          } else {
            // Use the original message but prefix with field name
            message = `${readableField}: ${err.msg}`;
          }
          
          return message;
        }
        
        return `${readableField} has an error`;
      });
      
      // Join multiple errors with newlines for better readability
      const errorMessage = formattedErrors.length === 1 
        ? formattedErrors[0]
        : formattedErrors.join("\n");
      
      throw new Error(errorMessage);
    }

    // Handle FastAPI validation errors with detail array format
    if (errorData.detail) {
      if (Array.isArray(errorData.detail)) {
        const formattedErrors = errorData.detail.map((err: { loc?: (string | number)[]; msg?: string; type?: string; ctx?: Record<string, unknown> }) => {
          let field = "field";
          if (err.loc && Array.isArray(err.loc)) {
            // Filter out "body" and numeric indices, keep only meaningful field names
            const meaningfulFields = err.loc.filter(
              (item) => typeof item === "string" && item !== "body"
            );
            if (meaningfulFields.length > 0) {
              field = meaningfulFields.join(".");
            } else if (err.loc.length > 0) {
              // Fallback to last element if no meaningful fields found
              const lastItem = err.loc[err.loc.length - 1];
              field = typeof lastItem === "string" ? lastItem : String(lastItem);
            }
          }
          
          const readableField = String(field)
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
          
          if (err.msg) {
            let message = err.msg;
            
            if (err.type === "enum" && err.ctx?.expected) {
              const expected = String(err.ctx.expected);
              // Clean up the expected values - remove quotes and format nicely
              const cleanExpected = expected
                .replace(/'/g, "")
                .replace(/"/g, "")
                .split(" or ")
                .join(", ");
              message = `${readableField} must be one of: ${cleanExpected}`;
            } else if (err.type === "missing" || err.type === "value_error.missing") {
              message = `${readableField} is required`;
            } else {
              message = `${readableField}: ${err.msg}`;
            }
            
            return message;
          }
          
          return `${readableField} has an error`;
        });
        
        const errorMessage = formattedErrors.length === 1
          ? formattedErrors[0]
          : formattedErrors.join("\n");
        
        throw new Error(errorMessage);
      } else if (typeof errorData.detail === "string") {
        throw new Error(errorData.detail);
      } else if (typeof errorData.detail === "object" && errorData.detail !== null && "message" in errorData.detail) {
        // Handle custom exception format
        throw new Error((errorData.detail as { message: string }).message);
      }
    }

    // Check for error message in various formats
    const detailMessage = typeof errorData.detail === "object" && errorData.detail !== null && "message" in errorData.detail
      ? (errorData.detail as { message: string }).message
      : undefined;
    
    // If we have any error data but couldn't parse it properly, log it for debugging
    if (process.env.NODE_ENV === "development" && Object.keys(errorData).length > 0) {
      console.error("⚠️ Unhandled error format:", errorData);
    }
    
    // Try to extract a meaningful error message
    let errorMessage = 
      errorData.message ||
      errorData.error_message ||
      detailMessage ||
      (typeof errorData.detail === "string" ? errorData.detail : undefined);
    
    // If we still don't have a message, use the response text (might be plain text error)
    if (!errorMessage && responseText) {
      errorMessage = responseText.trim();
    }
    
    // Final fallback - avoid showing generic "Bad Request" messages
    if (!errorMessage) {
      if (response.status === 400) {
        errorMessage = "Invalid request. Please check your input and try again.";
      } else if (response.status === 422) {
        errorMessage = "Validation error. Please check your input.";
      } else if (response.status === 401) {
        errorMessage = "Authentication required. Please log in again.";
      } else if (response.status === 403) {
        errorMessage = "You don't have permission to perform this action.";
      } else if (response.status === 404) {
        errorMessage = "The requested resource was not found.";
      } else if (response.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      } else {
        errorMessage = `Request failed with status ${response.status}`;
      }
    }

    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
const LOCATION_ENUM_MAP: Record<string, string> = {
  "addis ababa": "Addis Ababa",
  "addis_ababa": "Addis Ababa",
  "adama": "Adama",
  "dukem": "Dukem",
  "bishoftu": "Bishoftu",
  "hawassa": "Hawassa",
  "shashemene": "Shashemene",
  "djibouti": "Djibouti",
  "djibouti port": "Djibouti Port",
  "djibouti_port": "Djibouti Port",
  "debre zeit": "debre_zeit",
  "debre_zeit": "debre_zeit",
};


function normalizeLocation(value?: string): string | undefined {
  if (!value) return undefined;

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/_/g, " ");

  return LOCATION_ENUM_MAP[normalized];
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
    if (params?.origin)
      searchParams.append("origin", normalizeLocation(params.origin) ?? params.origin);
    
    if (params?.destination)
      searchParams.append(
        "destination",
        normalizeLocation(params.destination) ?? params.destination
      );
    
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
    const normalizedOrigin = normalizeLocation(data.origin) ?? data.origin;
    const normalizedDestination = normalizeLocation(data.destination) ?? data.destination;
    const normalizedData: CreateShipmentPayload = {
      ...data,
      origin: normalizedOrigin as CreateShipmentPayload["origin"],
      destination: normalizedDestination as CreateShipmentPayload["destination"],
    };
  
    const response = await apiRequest<ShipmentCreateResponse>(`${API_PATH}/`, {
      method: "POST",
      body: JSON.stringify(normalizedData),
    });
  
    return response.result;
  },
  

  // Update shipment (PATCH)
  async update(id: number, data: UpdateShipmentPayload): Promise<Shipment> {
    const normalizedOrigin = data.origin ? normalizeLocation(data.origin) ?? data.origin : data.origin;
    const normalizedDestination = data.destination ? normalizeLocation(data.destination) ?? data.destination : data.destination;
    const normalizedData: UpdateShipmentPayload = {
      ...data,
      origin: normalizedOrigin as UpdateShipmentPayload["origin"],
      destination: normalizedDestination as UpdateShipmentPayload["destination"],
    };
    
    const response = await apiRequest<ShipmentCreateResponse>(
      `${API_PATH}/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(normalizedData),
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
