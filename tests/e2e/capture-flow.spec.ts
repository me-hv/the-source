import { test, expect } from "@playwright/test";

test.describe("THE SOURCE — Local Development & Multi-Modal Capture UI", () => {
  test("unauthenticated access to protected routes redirects to login", async ({ page }) => {
    await page.goto("/overview");
    await expect(page).toHaveURL(/.*login.*redirectTo=%2Foverview/);
  });

  test("login page displays local development mode banner and allows 1-click entry", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toHaveText("Enter Your Studio");

    // Local mode banner should be visible
    const localBanner = page.locator("text=Local Development Mode");
    await expect(localBanner).toBeVisible();

    // Click 1-click enter studio
    await page.click("text=Enter Studio Directly (Local Mode)");

    // Should redirect to /overview
    await expect(page).toHaveURL(/.*overview/);
    await expect(page.getByRole("heading", { name: "Welcome back, Local Artist." })).toBeVisible();
  });

  test("overview page displays local vault badge and quick capture launchpad", async ({
    page,
  }) => {
    // Authenticate into local session
    await page.goto("/login");
    await page.click("text=Enter Studio Directly (Local Mode)");
    await expect(page).toHaveURL(/.*overview/);

    // Verify local mode header badge
    await expect(page.locator("text=Local Vault (No Supabase)")).toBeVisible();

    // Verify Quick Capture launchpad cards
    await expect(page.locator("text=Capture Idea")).toBeVisible();
    await expect(page.locator("text=Voice Take")).toBeVisible();
    await expect(page.locator("text=Visual Asset")).toBeVisible();
    await expect(page.locator("text=Document")).toBeVisible();
    await expect(page.locator("text=Inspiration Link")).toBeVisible();
  });

  test("opens Quick Capture modal via keyboard shortcut and creates a note", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.click("text=Enter Studio Directly (Local Mode)");
    await expect(page).toHaveURL(/.*overview/);

    // Trigger keyboard shortcut Ctrl+K
    await page.keyboard.press("Control+KeyK");

    // Modal dialog should open
    const dialog = page.locator("[role='dialog']");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("text=Quick Capture")).toBeVisible();

    // Type title and content in Tiptap editor
    await page.fill("input#note-title", "E2E Lyrical Draft");
    await page.locator(".ProseMirror").fill("Everything you create comes from something.");

    // Click Save Note
    await page.click("button:has-text('Save Note')");

    // Modal should close
    await expect(dialog).not.toBeVisible();

    // Verify the saved note appears in Recent Captures feed
    await expect(page.locator("text=E2E Lyrical Draft").first()).toBeVisible();
  });

  test("saves an inspiration link and displays it in recent captures", async ({ page }) => {
    await page.goto("/login");
    await page.click("text=Enter Studio Directly (Local Mode)");
    await expect(page).toHaveURL(/.*overview/);

    // Click Inspiration Link on the trigger box
    await page.click("button:has-text('Inspiration Link')");

    const dialog = page.locator("[role='dialog']");
    await expect(dialog).toBeVisible();

    // Fill link form
    await page.fill("input#link-url", "https://thesource.studio/inspiration");
    await page.fill("input#link-title", "Inspiration Archive");
    await page.fill("textarea#link-desc", "Curated visual notes and sound clips");

    // Save link
    await page.click("button:has-text('Save Reference Link')");

    // Modal should close
    await expect(dialog).not.toBeVisible();

    // Verify link appears in recent captures
    await expect(page.locator("text=Inspiration Archive").first()).toBeVisible();
  });

  test("preserves unsaved content when switching capture tabs", async ({ page }) => {
    await page.goto("/login");
    await page.click("text=Enter Studio Directly (Local Mode)");
    await expect(page).toHaveURL(/.*overview/);

    // Open modal
    await page.keyboard.press("Control+KeyK");
    const dialog = page.locator("[role='dialog']");
    await expect(dialog).toBeVisible();

    // Fill Note title
    await page.fill("input#note-title", "Unsaved Verse Draft");

    // Switch to Link tab inside dialog
    await dialog.locator("button:has-text('Inspiration Link')").click();
    await expect(page.locator("input#link-url")).toBeVisible();

    // Switch back to Note tab inside dialog
    await dialog.locator("button:has-text('Note / Draft')").click();
    await expect(page.locator("input#note-title")).toHaveValue("Unsaved Verse Draft");
  });
});
