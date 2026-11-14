import { describe, it, expect } from "vitest";
import { signupSchema, loginSchema } from "@/lib/validation/auth";
import { createWorkspaceSchema } from "@/lib/validation/workspace";

describe("Authentication Validation Schemas", () => {
  describe("signupSchema", () => {
    it("should accept valid signup data", () => {
      const valid = {
        displayName: "Kendrick",
        email: "kendrick@pglang.com",
        password: "Password123",
      };
      const result = signupSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject display names that are too short", () => {
      const invalid = {
        displayName: "A",
        email: "artist@example.com",
        password: "Password123",
      };
      const result = signupSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 2 characters");
      }
    });

    it("should reject invalid email formats", () => {
      const invalid = {
        displayName: "Kendrick",
        email: "not-an-email",
        password: "Password123",
      };
      const result = signupSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("valid email");
      }
    });

    it("should reject passwords under 8 characters", () => {
      const invalid = {
        displayName: "Kendrick",
        email: "artist@example.com",
        password: "Pass1",
      };
      const result = signupSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 8 characters");
      }
    });

    it("should reject passwords without numbers", () => {
      const invalid = {
        displayName: "Kendrick",
        email: "artist@example.com",
        password: "PasswordWithoutNumber",
      };
      const result = signupSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least one number");
      }
    });

    it("should normalize email to lowercase", () => {
      const data = {
        displayName: "Miles",
        email: "MILes.Davis@Columbia.Com",
        password: "Password123",
      };
      const result = signupSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("miles.davis@columbia.com");
      }
    });
  });

  describe("loginSchema", () => {
    it("should accept valid login credentials", () => {
      const valid = {
        email: "miles@example.com",
        password: "secretpassword",
      };
      const result = loginSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject missing password", () => {
      const invalid = {
        email: "miles@example.com",
        password: "",
      };
      const result = loginSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("createWorkspaceSchema", () => {
    it("should accept valid workspace creation input", () => {
      const valid = {
        name: "Blue Note Studio",
        description: "Studio for raw sessions",
        isPersonal: true,
      };
      const result = createWorkspaceSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject empty workspace name", () => {
      const invalid = {
        name: "   ",
        isPersonal: true,
      };
      const result = createWorkspaceSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
