import { request } from "@/lib/api-client";
import {
  containerSchema,
  containerListSchema,
  CreateContainerInput,
  UpdateContainerInput,
  Container,
} from "@/lib/zod/container.schema";

export type ListContainersParams = {
  page?: number;
  per_page?: number;
  container_number?: string;
  status?: string;
  container_size?: string;
  truck_type?: string;
  axle_type?: string;
};

function buildQuery(params: Record<string, any>) {
  return new URLSearchParams(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== ""
    )
  ).toString();
}

export const containerApi = {
//  list
  async list(params: ListContainersParams) {
    const res = await request<unknown>(
      `/container/?${buildQuery(params)}`
    );

    if (res.error) {
      throw new Error(res.error);
    }
    
    // Debug: Log the response in development
    if (process.env.NODE_ENV === "development") {
      console.log("📦 Container API Response:", res.data);
      console.log("📦 Container Items Count:", Array.isArray(res.data?.items) ? res.data.items.length : "Not an array");
    }
    
    try {
      const parsed = containerListSchema.parse(res.data);
      if (process.env.NODE_ENV === "development") {
        console.log("✅ Container list parsed successfully:", parsed);
        console.log("✅ Parsed items count:", parsed.items?.length);
      }
      return parsed;
    } catch (error: any) {
      console.error("❌ Container list schema validation error:", error);
      if (error.issues) {
        console.error("❌ Validation issues:", JSON.stringify(error.issues, null, 2));
        error.issues.forEach((issue: any, idx: number) => {
          console.error(`❌ Issue ${idx + 1}:`, issue.path, issue.message, issue.code);
        });
      }
      console.error("❌ Response data:", JSON.stringify(res.data, null, 2));
      console.error("❌ Response items:", res.data?.items);
      if (res.data?.items && res.data.items.length > 0) {
        console.error("❌ First item structure:", JSON.stringify(res.data.items[0], null, 2));
      }
      throw new Error(`Invalid container list response format: ${error.message || "Schema validation failed"}`);
    }
  },

// get by id 
  async get(id: number): Promise<Container> {
    const res = await request<unknown>(
      `/container/${id}`
    );

    if (res.error) {
      throw new Error(res.error);
    }

    return containerSchema.parse(res.data);
  },

// create
  async create(
    payload: CreateContainerInput
  ): Promise<Container> {
    const res = await request<unknown>(
      "/container/",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    if (res.error) {
      throw new Error(res.error);
    }
    return containerSchema.parse(res.data);
  },

// update
  async update(id: number, payload: UpdateContainerInput): Promise<Container> {
    const res = await request<unknown>(`/container/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  
    if (res.error) {
      throw new Error(res.error);
    }
  
    return { ...payload, id } as Container;
  },
// delete
  async delete(id: number): Promise<void> {
    const res = await request(
      `/container/${id}`,
      { method: "DELETE" }
    );

    if (res.error) {
      throw new Error(res.error);
    }
  },
};
