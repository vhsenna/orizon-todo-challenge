import { api } from "./api";
import { PaginatedResponse } from "./tasks";

export type Category = {
  id: number;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
};

export type CategoryPayload = {
  name: string;
  color: string;
};

export async function getCategories(): Promise<PaginatedResponse<Category>> {
  const response = await api.get<PaginatedResponse<Category>>("/categories/");
  return response.data;
}

export async function createCategory(payload: CategoryPayload): Promise<Category> {
  const response = await api.post<Category>("/categories/", payload);
  return response.data;
}
