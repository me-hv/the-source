// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { updateSession } from "@/lib/supabase/middleware";
import { NextRequest } from "next/server";

// Mock @supabase/ssr
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn((_url, _key, options) => {
    return {
      auth: {
        getUser: vi.fn().mockImplementation(async () => {
          const cookies = options.cookies.getAll();
          const hasAuthCookie = cookies.some((c: { name: string }) =>
            c.name.includes("auth-token")
          );
          if (hasAuthCookie) {
            return {
              data: {
                user: {
                  id: "authenticated-user-id",
                  email: "artist@source.fm",
                },
              },
              error: null,
            };
          }
          return { data: { user: null }, error: new Error("Not logged in") };
        }),
      },
    };
  }),
}));

describe("Route Protection Middleware", () => {
  it("should redirect unauthenticated users trying to access /overview to /login", async () => {
    const request = new NextRequest("http://localhost:3000/overview", {
      headers: new Headers(),
    });
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/login");
    expect(location).toContain("redirectTo=%2Foverview");
  });

  it("should redirect authenticated users on /login to /overview", async () => {
    const headers = new Headers();
    headers.set("cookie", "sb-auth-token=valid-token");
    const request = new NextRequest("http://localhost:3000/login", {
      headers,
    });
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/overview");
  });

  it("should redirect authenticated users on /signup to /overview", async () => {
    const headers = new Headers();
    headers.set("cookie", "sb-auth-token=valid-token");
    const request = new NextRequest("http://localhost:3000/signup", {
      headers,
    });
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/overview");
  });

  it("should allow authenticated users to access /overview", async () => {
    const headers = new Headers();
    headers.set("cookie", "sb-auth-token=valid-token");
    const request = new NextRequest("http://localhost:3000/overview", {
      headers,
    });
    const response = await updateSession(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
