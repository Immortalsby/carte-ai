import { test, expect } from "playwright/test";

test.describe("AI Recommendation Flow", () => {
  test("full recommendation journey — multi-step: mode → preferences → results", async ({
    page,
  }) => {
    // 1. Visit the restaurant page
    const response = await page.goto("/r/pokemi-roanne");
    expect(response?.status()).toBe(200);

    // 2. Verify the page loaded with restaurant header
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();

    // 3. Click the recommend button
    const recommendBtn = page.locator("button", {
      hasText: /recommend|recommander|帮我推荐|Plan our meal|Composer|帮我们组菜|おすすめ/i,
    });
    await expect(recommendBtn).toBeVisible();
    await recommendBtn.click();

    // 4. The concierge heading should appear
    const conciergeHeading = page.getByRole("heading", { name: /concierge/i });
    await expect(conciergeHeading).toBeVisible();

    // 5. Mode selection grid should be visible
    const modeGrid = page.locator(".grid.grid-cols-2");
    await expect(modeGrid).toBeVisible();
    const modeButtons = modeGrid.locator("button");
    expect(await modeButtons.count()).toBeGreaterThanOrEqual(2);

    // 6. Click a mode button → should go to preferences step
    await modeButtons.first().click();

    // 7. Preferences step: budget selector should appear
    const budgetButtons = page.locator("button", { hasText: /€|No limit|Sans limite|不限/i });
    expect(await budgetButtons.count()).toBeGreaterThanOrEqual(2);

    // 8. Spice level selector should appear
    const spiceButtons = page.locator("button", { hasText: /Mild|No spice|Medium|Hot|微辣|不辣|中辣|重辣|Léger|Non épicé/i });
    expect(await spiceButtons.count()).toBeGreaterThanOrEqual(2);

    // 9. Free text input should be visible (FR19)
    const textInput = page.locator("textarea");
    await expect(textInput).toBeVisible();

    // 10. Voice input button should be visible (FR19)
    const voiceBtn = page.locator("button[title]").filter({ has: page.locator("svg") });
    expect(await voiceBtn.count()).toBeGreaterThanOrEqual(1);

    // 11. "Get recommendations" button should exist
    const submitBtn = page.locator("button", {
      hasText: /Get recommendation|Obtenir|获取推荐/i,
    });
    await expect(submitBtn).toBeVisible();

    // 12. Back button should exist
    const backBtn = page.locator("button", { hasText: /Back|Retour|返回/i });
    await expect(backBtn).toBeVisible();

    // 13. Select a budget
    await budgetButtons.first().click();

    // 14. Type in the text input
    await textInput.fill("Something warm and comforting");

    // 15. Listen for API response and submit
    const apiPromise = page.waitForResponse(
      (resp) => resp.url().includes("/api/recommend"),
      { timeout: 60000 }
    );
    await submitBtn.click();

    // 16. Wait for the API call to complete
    const apiResp = await apiPromise;
    expect(apiResp.status()).toBe(200);

    // 17. Verify recommendation cards appear
    const resultArticle = page.locator("article");
    await expect(resultArticle.first()).toBeVisible({ timeout: 10000 });
    expect(await resultArticle.count()).toBeGreaterThanOrEqual(1);

    // 18. First card should have best match badge, title, and price
    const firstCard = resultArticle.first();
    await expect(firstCard.locator("h3")).toBeVisible();
    await expect(firstCard.locator("text=/€/")).toBeVisible();

    // 19. "Browse full menu" button should be available
    const browseBtn = page.locator("button", {
      hasText: /browse|parcourir|浏览|メニュー/i,
    });
    await expect(browseBtn).toBeVisible();
  });

  test("back button returns to mode selection", async ({ page }) => {
    await page.goto("/r/pokemi-roanne");

    // Open concierge
    const recommendBtn = page.locator("button", {
      hasText: /recommend|recommander|帮我推荐|Plan our meal|おすすめ/i,
    });
    await recommendBtn.click();

    // Select a mode
    const modeGrid = page.locator(".grid.grid-cols-2");
    await expect(modeGrid).toBeVisible();
    await modeGrid.locator("button").first().click();

    // Should be on preferences step
    const textInput = page.locator("textarea");
    await expect(textInput).toBeVisible();

    // Click back
    const backBtn = page.locator("button", { hasText: /Back|Retour|返回/i });
    await backBtn.click();

    // Mode grid should reappear
    await expect(modeGrid).toBeVisible();
  });

  test("browse menu button closes concierge", async ({ page }) => {
    await page.goto("/r/pokemi-roanne");

    const recommendBtn = page.locator("button", {
      hasText: /recommend|recommander|帮我推荐|Plan our meal|おすすめ/i,
    });
    await expect(recommendBtn).toBeVisible();
    await recommendBtn.click();

    const conciergeHeading = page.getByRole("heading", { name: /concierge/i });
    await expect(conciergeHeading).toBeVisible();

    const browseBtn = page.locator("button", {
      hasText: /browse|parcourir|浏览|メニュー/i,
    });
    await browseBtn.click();

    // Concierge should close, recommend button should reappear
    await expect(recommendBtn).toBeVisible();
  });

  test("allergen disclaimer is always visible during recommendation", async ({
    page,
  }) => {
    await page.goto("/r/pokemi-roanne");

    const recommendBtn = page.locator("button", {
      hasText: /recommend|recommander|帮我推荐|Plan our meal|おすすめ/i,
    });
    await recommendBtn.click();

    const disclaimer = page.locator('footer[role="alert"]');
    await expect(disclaimer).toBeVisible();
    await expect(disclaimer).toContainText("Allergen");
  });

  test("dish detail shows calorie information", async ({ page }) => {
    await page.goto("/r/pokemi-roanne");

    // Click the first dish card to open detail drawer
    const dishCard = page.locator("button", { hasText: /€/ }).first();
    await dishCard.click();

    // Calorie section should be visible
    const calorieLabel = page.locator("text=/Calories|卡路里/i");
    await expect(calorieLabel).toBeVisible();

    // Should show either kcal value or "Not provided"
    const calorieValue = page.locator("text=/kcal|Not provided|Non fourni|未提供/");
    await expect(calorieValue).toBeVisible();
  });
});
