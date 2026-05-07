import { test, expect } from "playwright/test";

test.describe("Mascot click to open panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/r/pokemi-roanne");
    await page.waitForSelector('[aria-label="AI Assistant"]', { timeout: 10000 });
  });

  test("click mascot opens panel", async ({ page }) => {
    const mascot = page.locator('[aria-label="AI Assistant"]').first();
    await mascot.click();
    await page.waitForTimeout(500);

    // Panel should be visible (ConciergePanel renders inside the fixed container)
    const panel = page.locator('[aria-label="AI Assistant"]')
      .locator("..").locator("..").locator(".rounded-2xl.shadow-xl");
    const concierge = page.locator("text=Touchez-moi pour des suggestions").or(
      page.locator("button", { hasText: /tourist|group|rapide|découverte/i })
    );
    const anyVisible = await concierge.first().isVisible().catch(() => false);
    console.log(`Concierge content visible: ${anyVisible}`);
    expect(anyVisible).toBe(true);
  });

  test("close and reopen panel", async ({ page }) => {
    const mascot = page.locator('[aria-label="AI Assistant"]').first();

    // Open
    await mascot.click();
    await page.waitForTimeout(500);

    // Find close button
    const closeBtn = page.locator("button", { hasText: /fermer|close|关闭/i });
    const closeBtnVisible = await closeBtn.first().isVisible().catch(() => false);
    console.log(`Close button visible: ${closeBtnVisible}`);

    if (closeBtnVisible) {
      await closeBtn.first().click();
      await page.waitForTimeout(500);

      // Reopen
      await mascot.click();
      await page.waitForTimeout(500);
      const concierge = page.locator("button", { hasText: /tourist|group|rapide|découverte/i });
      expect(await concierge.first().isVisible().catch(() => false)).toBe(true);
    }
  });
});
