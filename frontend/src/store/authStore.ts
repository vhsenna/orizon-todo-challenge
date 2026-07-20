import { create } from "zustand";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (tokens: { access: string; refresh: string }) => void;
  setAccessToken: (access: string) => void;
  clearSession: () => void;
};

const storedRefreshToken = localStorage.getItem("orizon_refresh_token");

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: storedRefreshToken,
  setSession: (tokens) => {
    localStorage.setItem("orizon_refresh_token", tokens.refresh);
    set({ accessToken: tokens.access, refreshToken: tokens.refresh });
  },
  setAccessToken: (access) => {
    set({ accessToken: access });
  },
  clearSession: () => {
    localStorage.removeItem("orizon_refresh_token");
    set({ accessToken: null, refreshToken: null });
  },
}));
