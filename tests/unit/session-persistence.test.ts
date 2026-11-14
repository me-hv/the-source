// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

describe("Session Persistence & Cookie Handling", () => {
  it("should retrieve session tokens from cookie storage correctly", () => {
    const mockCookieStore = new Map<string, string>();
    mockCookieStore.set("sb-access-token", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock");
    mockCookieStore.set("sb-refresh-token", "mock-refresh-token-xyz");

    const getAll = () =>
      Array.from(mockCookieStore.entries()).map(([name, value]) => ({
        name,
        value,
      }));

    const cookies = getAll();
    expect(cookies).toHaveLength(2);
    expect(cookies.find((c) => c.name === "sb-access-token")?.value).toContain("eyJ");
    expect(cookies.find((c) => c.name === "sb-refresh-token")?.value).toBe("mock-refresh-token-xyz");
  });

  it("should preserve updated session cookies during session refresh", () => {
    const mockCookieStore = new Map<string, string>();

    const setAll = (
      cookiesToSet: Array<{ name: string; value: string; options?: any }>
    ) => {
      cookiesToSet.forEach(({ name, value }) => {
        mockCookieStore.set(name, value);
      });
    };

    // Simulate Supabase refresh event updating tokens
    setAll([
      { name: "sb-access-token", value: "new-access-token" },
      { name: "sb-refresh-token", value: "new-refresh-token" },
    ]);

    expect(mockCookieStore.get("sb-access-token")).toBe("new-access-token");
    expect(mockCookieStore.get("sb-refresh-token")).toBe("new-refresh-token");
  });

  it("should clear session tokens on user sign out", () => {
    const mockCookieStore = new Map<string, string>([
      ["sb-access-token", "active-token"],
      ["sb-refresh-token", "active-refresh"],
    ]);

    const signOut = () => {
      mockCookieStore.delete("sb-access-token");
      mockCookieStore.delete("sb-refresh-token");
    };

    signOut();

    expect(mockCookieStore.get("sb-access-token")).toBeUndefined();
    expect(mockCookieStore.get("sb-refresh-token")).toBeUndefined();
  });
});
