import { create } from "zustand";

type AuthState = {
  accessToken: string | null;
  setSession: (tokens: { access: string }) => void;
  setAccessToken: (access: string) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  setSession: (tokens) => {
    set({ accessToken: tokens.access });
  },
  setAccessToken: (access) => {
    set({ accessToken: access });
  },
  clearSession: () => {
    set({ accessToken: null });
  },
}));
