import { api } from "./api";

export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  category: number | null;
  shared_with: number[];
  created_at: string;
  updated_at: string;
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type TaskPayload = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
};

export async function getTasks(): Promise<PaginatedResponse<Task>> {
  const response = await api.get<PaginatedResponse<Task>>("/tasks/");
  return response.data;
}

export async function createTask(payload: TaskPayload): Promise<Task> {
  const response = await api.post<Task>("/tasks/", payload);
  return response.data;
}

export async function updateTask(id: number, payload: Partial<TaskPayload>): Promise<Task> {
  const response = await api.patch<Task>(`/tasks/${id}/`, payload);
  return response.data;
}

export async function deleteTask(id: number): Promise<void> {
  await api.delete(`/tasks/${id}/`);
}

export async function toggleTask(id: number): Promise<Task> {
  const response = await api.patch<Task>(`/tasks/${id}/toggle/`);
  return response.data;
}
