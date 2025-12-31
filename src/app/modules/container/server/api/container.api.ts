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
    return containerListSchema.parse(res.data);
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
