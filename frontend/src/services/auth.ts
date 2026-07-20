import { api } from "./api";

export type AuthTokens = {
  access: string;
  refresh: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = LoginPayload & {
  username: string;
};

export async function login(payload: LoginPayload): Promise<AuthTokens> {
  const response = await api.post<AuthTokens>("/auth/login/", payload);
  return response.data;
}

export async function register(payload: RegisterPayload): Promise<AuthTokens> {
  const response = await api.post<{ tokens: AuthTokens }>("/auth/register/", payload);
  return response.data.tokens;
}
