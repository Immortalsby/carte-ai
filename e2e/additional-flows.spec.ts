import { test, expect } from "playwright/test";

const SLUG = "pokemi-roanne";
const BASE = `/r/${SLUG}`;

// ---------------------------------------------------------------------------
// Helper: visit the restaurant page and return status code.
// Many tests below should gracefully skip when the tenant doesn't exist in DB.
// ---------------------------------------------------------------------------
async function visitRestaurant(page: import("playwright/test").Page) {
  const response = await page.goto(BASE);
  return response?.status() ?? 0;
}

// ===========================================================================
// 1. Culture-aware mode switching (FR16-18)
// ===========================================================================
test.describe("Culture-aware mode switching (FR16-18)", () => {
  test("Chinese Accept-Language triggers group meal mode and mode switch button exists", async ({
    browser,
  }) => {
    // Create a context with Chinese locale to simulate Accept-Language: zh
    const context = await browser.newContext({
      locale: "zh-CN",
      extraHTTPHeaders: { "Accept-Language": "zh-CN,zh;q=0.9" },
    });
    const page = await context.newPage();

    const status = await visitRestaurant(page);
    if (status !== 200) {
      await context.close();
      test.skip(true, "Tenant does not exist — skipping culture-aware test");
      return;
    }

    // The page should detect Chinese and auto-switch to group_meal mode (FR16).
    // Evidence: the mode-switch button should show the "tourist" alternative
    // label, e.g. "第一次来这家？" (meaning the current mode is group_meal).
    const modeSwitchBtn = page.locator("button", {
      hasText: /第一次来这家|First time here|Première visite|组菜顾问|Group meal advisor|Conseiller repas/i,
    });
    await expect(modeSwitchBtn).toBeVisible({ timeout: 5000 });

    // Click the mode switch button and verify it toggles
    const textBefore = await modeSwitchBtn.textContent();
    await modeSwitchBtn.click();
    const textAfter = await modeSwitchBtn.textContent();
    expect(textAfter).not.toBe(textBefore);

    await context.close();
  });
});

// ===========================================================================
// 2. Allergen filter (FR29-30)
// ===========================================================================
test.describe("Allergen filter (FR29-30)", () => {
  test("allergen filter buttons exist and can be toggled", async ({ page }) => {
    const status = await visitRestaurant(page);
    if (status !== 200) {
      test.skip(true, "Tenant does not exist — skipping allergen filter test");
      return;
    }

    // Click the filter toggle button to reveal allergen options
    const filterToggle = page.locator("button", {
      hasText: /Filter|Filtres|过滤/i,
    });
    await expect(filterToggle).toBeVisible();
    await filterToggle.click();

    // Allergen buttons should appear (the AllergenFilter component renders a list)
    const peanutBtn = page.locator("button", {
      hasText: /Peanuts|Arachides|花生/i,
    });
    await expect(peanutBtn).toBeVisible({ timeout: 3000 });

    // Click peanuts to select it — button should gain an active style (has ✕ indicator)
    await peanutBtn.click();
    await expect(peanutBtn).toContainText("\u2715"); // ✕ character indicates active

    // The filter toggle should now show a count indicator
    await expect(filterToggle).toContainText("(1)");

    // Click peanuts again to deselect
    await peanutBtn.click();
    // ✕ should no longer be present
    const text = await peanutBtn.textContent();
    expect(text).not.toContain("\u2715");
  });
});

// ===========================================================================
// 3. Post-meal adoption popup (FR36)
// ===========================================================================
test.describe("Post-meal adoption popup (FR36)", () => {
  test("PostMealPrompt component appears after recommendation results", async ({
    page,
  }) => {
    const status = await visitRestaurant(page);
    if (status !== 200) {
      test.skip(true, "Tenant does not exist — skipping post-meal popup test");
      return;
    }

    // Open concierge
    const recommendBtn = page.locator("button", {
      hasText: /recommend|recommander|帮我推荐|Plan our meal|Composer|帮我们组菜|おすすめ/i,
    });
    await expect(recommendBtn).toBeVisible();
    await recommendBtn.click();

    // Select a mode
    const modeGrid = page.locator(".grid.grid-cols-2");
    await expect(modeGrid).toBeVisible();
    await modeGrid.locator("button").first().click();

    // Fill minimal preferences and submit
    const submitBtn = page.locator("button", {
      hasText: /Get recommendation|Obtenir|获取推荐/i,
    });
    await expect(submitBtn).toBeVisible();

    // Select a budget option
    const budgetBtn = page.locator("button", {
      hasText: /€|No limit|Sans limite|不限/i,
    });
    if ((await budgetBtn.count()) > 0) {
      await budgetBtn.first().click();
    }

    // Submit and wait for API response
    const apiPromise = page.waitForResponse(
      (resp) => resp.url().includes("/api/recommend"),
      { timeout: 60000 },
    );
    await submitBtn.click();
    const apiResp = await apiPromise;
    expect(apiResp.status()).toBe(200);

    // Wait for recommendation results to render
    const resultArticle = page.locator("article");
    await expect(resultArticle.first()).toBeVisible({ timeout: 10000 });

    // The PostMealPrompt has a default 20s delay, but we can check the DOM
    // for the component's fixed-position container appearing eventually.
    // Use a generous timeout to allow the delay timer to fire.
    const postMealPrompt = page.locator("text=/Did you order|Avez-vous commandé|你点了推荐菜吗/i");
    await expect(postMealPrompt).toBeVisible({ timeout: 25000 });
  });
});

// ===========================================================================
// 4. Share functionality
// ===========================================================================
test.describe("Share functionality", () => {
  test("share button exists on restaurant page", async ({ page }) => {
    const status = await visitRestaurant(page);
    if (status !== 200) {
      test.skip(true, "Tenant does not exist — skipping share test");
      return;
    }

    // The share button is at the bottom of the page alongside the mode switch
    const shareBtn = page.locator("button", {
      hasText: /Share|Partager|分享/i,
    });
    await expect(shareBtn).toBeVisible();

    // Click it to open the SharePanel
    await shareBtn.click();

    // SharePanel should show share options (WhatsApp, WeChat, etc.)
    const shareHeading = page.locator("h3", {
      hasText: /Share with friends|Partager avec vos amis|分享给朋友/i,
    });
    await expect(shareHeading).toBeVisible({ timeout: 3000 });

    // At least some share channel buttons should be visible
    const whatsappBtn = page.locator("button", { hasText: /WhatsApp/i });
    await expect(whatsappBtn).toBeVisible();

    const wechatBtn = page.locator("button", { hasText: /WeChat/i });
    await expect(wechatBtn).toBeVisible();

    // Close button should work
    const closeBtn = page.locator("button", {
      hasText: /Close|Fermer|关闭/i,
    });
    await closeBtn.click();
    await expect(shareHeading).not.toBeVisible();
  });
});

// ===========================================================================
// 5. Admin auth protection — /admin/:slug/menu
// ===========================================================================
test.describe("Admin auth protection", () => {
  test("/admin/:slug/menu redirects unauthenticated users to /login", async ({
    page,
  }) => {
    await page.goto(`/admin/${SLUG}/menu`);

    // Should redirect to /login (server-side redirect via Next.js)
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });
});

// ===========================================================================
// 6. Admin dashboard redirect without auth
// ===========================================================================
test.describe("Admin dashboard redirect", () => {
  test("/admin/:slug without auth redirects to /login", async ({ page }) => {
    await page.goto(`/admin/${SLUG}`);

    // Should redirect to /login
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });
});

// ===========================================================================
// 7. API rate limiting — smoke test
// ===========================================================================
test.describe("API rate limiting smoke test", () => {
  test("multiple rapid POST requests to /api/recommend do not return 500", async ({
    request,
  }) => {
    // Minimal valid-ish payload (may return 400 if schema requires more, but NOT 500)
    const payload = {
      language: "en",
      budgetCents: 2000,
      mode: "solo",
      partySize: 1,
      excludedTags: [],
      excludedAllergens: [],
      maxSpiceLevel: 3,
      userText: "anything",
    };

    // Fire 5 rapid requests in parallel
    const promises = Array.from({ length: 5 }, () =>
      request.post("/api/recommend", { data: payload }),
    );

    const responses = await Promise.all(promises);

    for (const resp of responses) {
      // We expect 200 (success) or 400 (validation error if no menu provided),
      // but never 500 (server crash).
      expect(resp.status()).not.toBe(500);
      expect([200, 400, 429]).toContain(resp.status());
    }
  });
});

// ===========================================================================
// 8. Menu API public access
// ===========================================================================
test.describe("Menu API public access", () => {
  test("GET /api/menus/:slug returns 200 with data or 404 if tenant missing", async ({
    request,
  }) => {
    const resp = await request.get(`/api/menus/${SLUG}`);

    // Should be 200 (menu exists) or 404 (tenant/menu not found) — never 500
    expect(resp.status()).not.toBe(500);
    expect([200, 404]).toContain(resp.status());

    if (resp.status() === 200) {
      const body = await resp.json();
      // The response should be the menu payload — an object with content
      expect(body).toBeTruthy();
      expect(typeof body).toBe("object");
    }

    if (resp.status() === 404) {
      const body = await resp.json();
      expect(body.error).toBeTruthy();
    }
  });

  test("GET /api/menus/:slug for non-existent restaurant returns 404", async ({
    request,
  }) => {
    const resp = await request.get("/api/menus/this-restaurant-does-not-exist-12345");
    expect(resp.status()).toBe(404);
    const body = await resp.json();
    expect(body.error).toBeTruthy();
  });
});
