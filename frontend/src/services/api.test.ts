import { describe, expect, it } from "vitest";

import { api } from "./api";

describe("api refresh retry", () => {
  it("creates the API client with credentials enabled", () => {
    expect(api.defaults.withCredentials).toBe(true);
    expect(api.defaults.baseURL).toBe("http://localhost:8000/api");
  });
});
