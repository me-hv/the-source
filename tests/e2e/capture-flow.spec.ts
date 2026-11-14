import { test, expect } from "@playwright/test";

test.describe("THE SOURCE — Multi-Modal Capture UI", () => {
  test("unauthenticated access to capture routes redirects to login", async ({ page }) => {
    await page.goto("/overview");
    await expect(page).toHaveURL(/.*login.*redirectTo=%2Foverview/);
  });

  test("login page is accessible and provides access to authentication flow", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toHaveText("Enter Your Studio");
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("signup page provides full workspace initialization fields", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("h1")).toHaveText("Initialize Workspace");
    await expect(page.locator("input#displayName")).toBeVisible();
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });
});
