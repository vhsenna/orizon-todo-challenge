import { api } from "./api";

export type AuthSession = {
  access: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = LoginPayload & {
  username: string;
};

export async function login(payload: LoginPayload): Promise<AuthSession> {
  const response = await api.post<AuthSession>("/auth/login/", payload);
  return response.data;
}

export async function register(payload: RegisterPayload): Promise<AuthSession> {
  const response = await api.post<AuthSession>("/auth/register/", payload);
  return response.data;
}

export async function refreshAccessToken(): Promise<AuthSession> {
  const response = await api.post<AuthSession>("/auth/token/refresh/");
  return response.data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout/");
}
