import { describe, expect, it, beforeEach } from "vitest";

import { useAuthStore } from "./authStore";

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
  });

  it("keeps access tokens in memory without persisting refresh tokens", () => {
    useAuthStore.getState().setSession({ access: "access-token" });

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("access-token");
    expect("refreshToken" in state).toBe(false);
  });
});
