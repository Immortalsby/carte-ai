/**
 * Automated screenshot script for Landing Page feature images.
 *
 * Usage:  npx tsx scripts/screenshot-landing.ts
 *
 * Prerequisites: dev server running at localhost:3000
 * Output: public/images/landing/
 *
 * For admin pages, set env vars:
 *   ADMIN_EMAIL=your@email.com  ADMIN_PASSWORD=yourpass
 *
 * Or pass --skip-admin to only screenshot customer pages.
 */

import { chromium, type Page, type BrowserContext } from "playwright";
import path from "path";

const BASE = "http://localhost:3000";
const SLUG = "pokemi-roanne";
const OUT = path.resolve(__dirname, "../public/images/landing");

const DESKTOP = { width: 1600, height: 1200 };
const MOBILE = { width: 393, height: 852 };

const skipAdmin = process.argv.includes("--skip-admin");
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function settle(page: Page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await sleep(2000);
}

/**
 * Log into admin and return the authenticated context
 */
async function loginAdmin(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
): Promise<BrowserContext | null> {
  if (!email || !password) {
    console.log("⚠ No ADMIN_EMAIL/ADMIN_PASSWORD — skipping admin screenshots");
    return null;
  }

  const ctx = await browser.newContext({ viewport: DESKTOP });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await sleep(1000);

  // Fill email & password
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for redirect to admin
  await page.waitForURL("**/admin/**", { timeout: 15000 }).catch(() => {
    console.log("⚠ Login redirect timeout — check credentials");
  });
  await sleep(1000);

  console.log("✓ Logged in as", email);
  return ctx;
}

async function main() {
  console.log("🚀 Launching browser...\n");
  const browser = await chromium.launch({ headless: true });

  // ── Customer page screenshots (no auth needed) ──

  // 1. English mobile
  console.log("📸 Customer page — English (mobile)");
  const enCtx = await browser.newContext({
    viewport: MOBILE,
    isMobile: true,
    hasTouch: true,
    locale: "en-US",
    extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
  });
  const enPage = await enCtx.newPage();
  await enPage.goto(`${BASE}/r/${SLUG}`, { waitUntil: "networkidle" });
  await settle(enPage);
  // Dismiss mascot intro if visible
  const gotIt = enPage.locator("text=Got it!");
  if (await gotIt.isVisible().catch(() => false)) {
    await gotIt.click();
    await sleep(800);
  }
  await enPage.screenshot({
    path: path.join(OUT, "feature-multilang-en.jpg"),
    type: "jpeg",
    quality: 92,
  });
  console.log("  ✓ feature-multilang-en.jpg");
  await enCtx.close();

  // 2. Chinese mobile
  console.log("📸 Customer page — Chinese (mobile)");
  const zhCtx = await browser.newContext({
    viewport: MOBILE,
    isMobile: true,
    hasTouch: true,
    locale: "zh-CN",
    extraHTTPHeaders: { "Accept-Language": "zh-CN,zh;q=0.9" },
  });
  const zhPage = await zhCtx.newPage();
  await zhPage.goto(`${BASE}/r/${SLUG}`, { waitUntil: "networkidle" });
  await settle(zhPage);
  const gotItZh = zhPage.locator("text=知道了").or(zhPage.locator("text=Got it!"));
  if (await gotItZh.isVisible().catch(() => false)) {
    await gotItZh.click();
    await sleep(800);
  }
  await zhPage.screenshot({
    path: path.join(OUT, "feature-multilang-zh.jpg"),
    type: "jpeg",
    quality: 92,
  });
  console.log("  ✓ feature-multilang-zh.jpg");
  await zhCtx.close();

  // 3. Allergen / recommendation flow (EN mobile, interact with mascot)
  console.log("📸 Customer page — Allergen/recommendation flow");
  const allCtx = await browser.newContext({
    viewport: MOBILE,
    isMobile: true,
    hasTouch: true,
    locale: "en-US",
    extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
  });
  const allPage = await allCtx.newPage();
  await allPage.goto(`${BASE}/r/${SLUG}`, { waitUntil: "networkidle" });
  await settle(allPage);

  // Try to open the mascot/concierge and get to preference step
  const gotItAll = allPage.locator("text=Got it!");
  if (await gotItAll.isVisible().catch(() => false)) {
    await gotItAll.click();
    await sleep(800);
  }

  // Click the mascot or speech bubble to open the panel
  // Try clicking the mascot area (bottom-right fixed element)
  const mascotArea = allPage.locator('[class*="fixed"][class*="bottom"]').first();
  if (await mascotArea.isVisible().catch(() => false)) {
    await mascotArea.click();
    await sleep(1500);
  }

  await allPage.screenshot({
    path: path.join(OUT, "feature-allergen.jpg"),
    type: "jpeg",
    quality: 92,
  });
  console.log("  ✓ feature-allergen.jpg");
  await allCtx.close();

  // ── Admin page screenshots (auth required) ──

  if (!skipAdmin) {
    const adminCtx = await loginAdmin(browser);

    if (adminCtx) {
      // 4. Menu editor / import page
      console.log("📸 Admin — Menu editor");
      const menuPage = await adminCtx.newPage();
      await menuPage.goto(`${BASE}/admin/${SLUG}/menu`, { waitUntil: "networkidle" });
      await settle(menuPage);
      await menuPage.screenshot({
        path: path.join(OUT, "feature-upload.jpg"),
        type: "jpeg",
        quality: 92,
      });
      console.log("  ✓ feature-upload.jpg");

      // 5. Analytics dashboard
      console.log("📸 Admin — Analytics");
      const analyticsPage = await adminCtx.newPage();
      await analyticsPage.goto(`${BASE}/admin/${SLUG}/analytics`, {
        waitUntil: "networkidle",
      });
      await settle(analyticsPage);
      await analyticsPage.screenshot({
        path: path.join(OUT, "feature-analytics.jpg"),
        type: "jpeg",
        quality: 92,
      });
      console.log("  ✓ feature-analytics.jpg");

      // 6. Dashboard overview
      console.log("📸 Admin — Dashboard");
      const dashPage = await adminCtx.newPage();
      await dashPage.goto(`${BASE}/admin/${SLUG}`, { waitUntil: "networkidle" });
      await settle(dashPage);
      await dashPage.screenshot({
        path: path.join(OUT, "feature-dashboard.jpg"),
        type: "jpeg",
        quality: 92,
      });
      console.log("  ✓ feature-dashboard.jpg");

      await adminCtx.close();
    }
  } else {
    console.log("\n⏭ Skipping admin screenshots (--skip-admin)");
  }

  await browser.close();

  console.log(`\n✅ Screenshots saved to ${OUT}`);
  console.log(`
📝 Next steps:
  1. Combine feature-multilang-en.jpg + feature-multilang-zh.jpg side by side
     → Use shots.so (free) to wrap in phone mockup frames
  2. Review & crop as needed
  3. Replace the old AI-generated images in the landing page
  `);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
