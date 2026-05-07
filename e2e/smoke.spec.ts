/**
 * Smoke tests — verify each major area renders without crashing.
 * Run: npx playwright test tests/smoke.spec.ts
 *
 * These tests require the dev server at localhost:3000.
 * Admin tests are skipped if ADMIN_EMAIL/ADMIN_PASSWORD are not set.
 */

import { test, expect } from "playwright/test";

const BASE = "http://localhost:3000";
const SLUG = "pokemi-roanne";

// ─── Landing Page (/) ───

test.describe("Landing Page", () => {
  test("renders hero section with CTA", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator("nav")).toBeVisible();
    // Hero title exists
    await expect(page.locator("h1")).toBeVisible();
    // At least one register CTA link
    await expect(page.locator('a[href="/register"]').first()).toBeVisible();
  });

  test("language switcher works", async ({ page }) => {
    await page.goto(BASE);
    const zhBtn = page.locator("button", { hasText: "中" });
    await zhBtn.click();
    // After switching, some Chinese text should appear
    await expect(page.locator("h1")).toContainText(/点|知道|顾客/);
  });

  test("FAQ accordion opens", async ({ page }) => {
    await page.goto(`${BASE}#faq`);
    const firstFaq = page.locator("details").first();
    await firstFaq.click();
    // The answer should become visible
    await expect(firstFaq.locator("div")).toBeVisible();
  });
});

// ─── Customer Page (/r/[slug]) ───

test.describe("Customer Page", () => {
  test("renders restaurant name and menu", async ({ page }) => {
    await page.goto(`${BASE}/r/${SLUG}`);
    // Restaurant name visible
    await expect(page.getByRole("heading", { name: "PokeMi" })).toBeVisible();
    // At least one dish card
    await expect(page.locator('[class*="rounded"]').filter({ hasText: "€" }).first()).toBeVisible();
  });

  test("language detection works (EN)", async ({ browser }) => {
    const ctx = await browser.newContext({ locale: "en-US" });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/r/${SLUG}`);
    await page.waitForLoadState("networkidle");
    // "English" tab should be highlighted or menu in English
    await expect(page.locator("text=English").first()).toBeVisible();
    await ctx.close();
  });

  test("language detection works (ZH)", async ({ browser }) => {
    const ctx = await browser.newContext({ locale: "zh-CN" });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/r/${SLUG}`);
    await page.waitForLoadState("networkidle");
    // Chinese tab should be active
    await expect(page.locator("text=中文").first()).toBeVisible();
    await ctx.close();
  });

  test("mascot concierge opens", async ({ page }) => {
    await page.goto(`${BASE}/r/${SLUG}`);
    await page.waitForLoadState("networkidle");
    // Dismiss intro if present
    const gotIt = page.locator("text=Got it!");
    if (await gotIt.isVisible().catch(() => false)) {
      await gotIt.click();
      await page.waitForTimeout(500);
    }
    // Click mascot/speech bubble area to open panel
    const mascot = page.locator('[class*="fixed"][class*="bottom"]').first();
    if (await mascot.isVisible().catch(() => false)) {
      await mascot.click();
      await page.waitForTimeout(1000);
      // Concierge panel should appear with occasion options
      await expect(
        page.locator("text=Just drinks").or(page.locator("text=小酌")).or(page.locator("text=AI Menu Concierge")),
      ).toBeVisible();
    }
  });

  test("allergen disclaimer always visible", async ({ page }) => {
    await page.goto(`${BASE}/r/${SLUG}`);
    // FR29/NFR11: disclaimer must always be present
    await expect(page.locator('[role="alert"]').first()).toContainText(/allergen|confirm/i);
  });
});

// ─── Admin Pages (/admin/[slug]) ───

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const hasAdmin = Boolean(adminEmail && adminPassword);

/** Login helper: calls sign-in API directly (bypasses Turnstile UI) */
async function adminLogin(page: any) {
  // Use the better-auth API directly to avoid Turnstile in automated tests.
  const res = await page.request.post(`${BASE}/api/auth/sign-in/email`, {
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`Admin login failed: ${res.status()} ${body}`);
  }
}

test.describe("Admin Pages", () => {
  test.skip(!hasAdmin, "ADMIN_EMAIL/ADMIN_PASSWORD not set");

  test("dashboard loads", async ({ browser }) => {
    if (!hasAdmin) return;
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await adminLogin(page);
    await page.goto(`${BASE}/admin/${SLUG}`);
    await expect(page.locator("h1").first()).toBeVisible();
    await ctx.close();
  });

  test("menu editor loads", async ({ browser }) => {
    if (!hasAdmin) return;
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await adminLogin(page);
    await page.goto(`${BASE}/admin/${SLUG}/menu`);
    await expect(
      page.locator("text=Menu Management").or(page.locator("text=菜单管理")),
    ).toBeVisible();
    await ctx.close();
  });

  test("analytics loads", async ({ browser }) => {
    if (!hasAdmin) return;
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await adminLogin(page);
    await page.goto(`${BASE}/admin/${SLUG}/analytics`);
    await expect(page.locator("h1").first()).toBeVisible();
    await ctx.close();
  });

  test("settings loads with AI models section", async ({ browser }) => {
    if (!hasAdmin) return;
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await adminLogin(page);
    await page.goto(`${BASE}/admin/${SLUG}/settings`);
    await expect(page.locator("h1").first()).toBeVisible();
    await ctx.close();
  });
});
