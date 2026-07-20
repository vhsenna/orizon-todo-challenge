import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

import { useAuthStore } from "../store/authStore";

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;
    const status = error.response?.status;
    const url = originalRequest?.url ?? "";
    const isAuthRefreshRequest = url.includes("/auth/token/refresh/");
    const canRetry = status === 401 && originalRequest && !originalRequest._retry && !isAuthRefreshRequest;

    if (!canRetry) {
      throw error;
    }

    originalRequest._retry = true;
    try {
      const response = await axios.post<{ access: string }>(
        `${baseURL}/auth/token/refresh/`,
        undefined,
        { withCredentials: true },
      );
      useAuthStore.getState().setAccessToken(response.data.access);
      originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
      return api(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().clearSession();
      throw refreshError;
    }
  },
);
