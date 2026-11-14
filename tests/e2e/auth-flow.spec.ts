import { test, expect } from "@playwright/test";

test.describe("THE SOURCE — Authentication & Foundation Flow", () => {
  test("landing page renders editorial headline and navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=THE SOURCE").first()).toBeVisible();
    await expect(page.locator("text=Everything you create comes from something.")).toBeVisible();
    await expect(page.locator("text=Enter Studio").first()).toBeVisible();
    await expect(page.locator("text=Get Started")).toBeVisible();
  });

  test("login page renders form fields and links to signup", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toHaveText("Enter Your Studio");
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.locator("button[type='submit']")).toContainText("Enter Studio");

    // Click link to signup
    await page.click("text=Claim your Source");
    await expect(page).toHaveURL(/.*signup/);
  });

  test("signup page renders artist identity and password fields", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("h1")).toHaveText("Initialize Workspace");
    await expect(page.locator("input#displayName")).toBeVisible();
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.locator("button[type='submit']")).toContainText("Create Private Workspace");
  });

  test("overview page redirects unauthenticated visitors to login", async ({ page }) => {
    await page.goto("/overview");
    await expect(page).toHaveURL(/.*login.*redirectTo=%2Foverview/);
  });
});
