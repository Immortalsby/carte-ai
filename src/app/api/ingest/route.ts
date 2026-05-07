import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { extractMenuDraftWithLlm } from "@/lib/llm";
import { getDefaultMenu, parseMenu, sanitizeRawMenu } from "@/lib/menu";
import type { RestaurantMenu, Dish } from "@/types/menu";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per file

function isLikelyText(type: string, name: string) {
  return (
    type.startsWith("text/") ||
    type.includes("json") ||
    type.includes("csv") ||
    type.includes("spreadsheet") ||
    /\.(json|csv|tsv|txt)$/i.test(name)
  );
}

function isSupportedBinary(type: string) {
  return type.startsWith("image/") || type === "application/pdf";
}

// ---------------------------------------------------------------------------
// Confidence scoring algorithm
// ---------------------------------------------------------------------------

/** Score based on source file type (text is more reliable than image) */
function fileTypeScore(files: File[]): number {
  const scores = files.map((f) => {
    const t = f.type || "";
    const n = f.name || "";
    if (t.includes("json") || /\.json$/i.test(n)) return 1.0;
    if (t.includes("csv") || /\.csv$/i.test(n)) return 0.85;
    if (t.startsWith("text/") || /\.(txt|tsv)$/i.test(n)) return 0.8;
    if (t === "application/pdf") return 0.7;
    if (t.startsWith("image/")) return 0.6;
    return 0.4;
  });
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/** Score based on image resolution (only for image files) */
function imageSizeScore(files: File[]): number {
  const imageFiles = files.filter((f) => f.type.startsWith("image/"));
  if (imageFiles.length === 0) return 0.85; // non-image files get a decent default

  const scores = imageFiles.map((f) => {
    // Estimate resolution from file size (rough heuristic)
    // JPEG: ~10KB/100x100, ~100KB/500x500, ~500KB/1000x1000, ~2MB/2000x2000
    const kb = f.size / 1024;
    if (kb < 20) return 0.3;    // tiny, likely unreadable
    if (kb < 100) return 0.5;   // low quality
    if (kb < 500) return 0.7;   // medium
    if (kb < 2000) return 0.85; // good
    return 0.95;                // high-res
  });
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/** Score based on extraction completeness — how many dishes have essential fields */
function completenessScore(menu: RestaurantMenu): number {
  const dishes = menu.dishes;
  if (dishes.length === 0) return 0;

  let totalScore = 0;
  for (const dish of dishes) {
    let fields = 0;
    let filled = 0;

    // name — at least one language filled
    fields++;
    if (dish.name.fr || dish.name.en || dish.name.zh) filled++;

    // price — must be > 0
    fields++;
    if (dish.priceCents > 0) filled++;

    // category — must be a valid value
    fields++;
    if (dish.category && dish.category !== ("" as string)) filled++;

    // description — at least one language
    fields++;
    if (dish.description.fr || dish.description.en || dish.description.zh) filled++;

    // allergens — should not be empty
    fields++;
    if (dish.allergens.length > 0) filled++;

    totalScore += filled / fields;
  }
  return totalScore / dishes.length;
}

/** Score based on price sanity — prices should be reasonable (€0.50 – €500) */
function priceSanityScore(dishes: Dish[]): number {
  if (dishes.length === 0) return 0;
  const reasonable = dishes.filter(
    (d) => d.priceCents >= 50 && d.priceCents <= 50000,
  );
  return reasonable.length / dishes.length;
}

/** Score based on dish count — more dishes = more likely a real menu */
function dishCountScore(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 0.4;
  if (count <= 5) return 0.6;
  if (count <= 10) return 0.8;
  if (count <= 30) return 0.9;
  return 0.95;
}

/** Calculate weighted confidence from all dimensions */
function calculateConfidence(files: File[], menu: RestaurantMenu): number {
  const weights = {
    fileType: 0.2,
    imageSize: 0.15,
    completeness: 0.3,
    priceSanity: 0.2,
    dishCount: 0.15,
  };

  const scores = {
    fileType: fileTypeScore(files),
    imageSize: imageSizeScore(files),
    completeness: completenessScore(menu),
    priceSanity: priceSanityScore(menu.dishes),
    dishCount: dishCountScore(menu.dishes.length),
  };

  const confidence =
    scores.fileType * weights.fileType +
    scores.imageSize * weights.imageSize +
    scores.completeness * weights.completeness +
    scores.priceSanity * weights.priceSanity +
    scores.dishCount * weights.dishCount;

  return Math.round(confidence * 100) / 100; // 2 decimal places
}

// ---------------------------------------------------------------------------
// Multi-file extraction helpers
// ---------------------------------------------------------------------------

async function extractSingleFile(file: File) {
  if (/\.json$/i.test(file.name) || file.type.includes("json")) {
    const json = JSON.parse(await file.text());
    return parseMenu(json);
  }

  if (isLikelyText(file.type, file.name)) {
    return extractMenuDraftWithLlm({
      fileName: file.name,
      mimeType: file.type || "text/plain",
      text: await file.text(),
    });
  }

  if (isSupportedBinary(file.type)) {
    const buffer = Buffer.from(await file.arrayBuffer());
    return extractMenuDraftWithLlm({
      fileName: file.name,
      mimeType: file.type,
      base64: buffer.toString("base64"),
    });
  }

  return null;
}

/** Merge multiple extracted menus: use the first restaurant info, combine all dishes (deduped by name) */
function mergeMenus(menus: RestaurantMenu[]): RestaurantMenu {
  const base = menus[0];
  const seenNames = new Set<string>();
  const allDishes: Dish[] = [];

  for (const menu of menus) {
    for (const dish of menu.dishes) {
      const key = `${dish.name.fr || ""}|${dish.name.en || ""}|${dish.name.zh || ""}`.toLowerCase();
      if (key === "||") continue; // skip dishes with no name
      if (seenNames.has(key)) continue;
      seenNames.add(key);
      allDishes.push(dish);
    }
  }

  return {
    ...base,
    dishes: allDishes,
    updatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const files: File[] = [];

  // Collect all uploaded files (support both "file" and "files" field names)
  for (const entry of formData.getAll("file")) {
    if (entry instanceof File) files.push(entry);
  }
  for (const entry of formData.getAll("files")) {
    if (entry instanceof File) files.push(entry);
  }

  if (files.length === 0) {
    return NextResponse.json(
      { error: "No menu file was uploaded." },
      { status: 400 },
    );
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Too many files. Maximum is ${MAX_FILES}.` },
      { status: 400 },
    );
  }

  // Validate file sizes
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File "${file.name}" exceeds 10 MB limit.` },
        { status: 400 },
      );
    }
  }

  const fileMeta = files.map((f) => ({
    name: f.name,
    type: f.type || "unknown",
    size: f.size,
  }));

  const defaultMenu = getDefaultMenu();

  try {
    // Extract each file in parallel
    const results = await Promise.all(
      files.map((f) => extractSingleFile(f).catch(() => null)),
    );

    const validMenus = results
      .filter((r): r is RestaurantMenu => r !== null && "dishes" in r && Array.isArray(r.dishes))
      .map((r) => parseMenu(sanitizeRawMenu(r as unknown as Record<string, unknown>)));

    if (validMenus.length === 0) {
      return NextResponse.json({
        status: "draft_needs_review",
        files: fileMeta,
        message: "Could not extract menu data from the uploaded files.",
        confidence: 0.1,
        draftMenu: {
          ...defaultMenu,
          restaurant: { ...defaultMenu.restaurant, name: "Imported Menu Draft" },
          updatedAt: new Date().toISOString(),
        },
      });
    }

    // Merge all extracted menus into one
    const merged = validMenus.length === 1 ? validMenus[0] : mergeMenus(validMenus);
    const confidence = calculateConfidence(files, merged);

    return NextResponse.json({
      status: "draft_ready",
      files: fileMeta,
      fileCount: files.length,
      extractedCount: validMenus.length,
      message:
        "AI draft created. Review names, prices, ingredients and allergen fields before publishing.",
      confidence,
      draftMenu: merged,
    });
  } catch (error) {
    return NextResponse.json({
      status: "draft_needs_review",
      files: fileMeta,
      message:
        error instanceof Error
          ? `Could not fully parse the files: ${error.message}`
          : "Could not fully parse the files.",
      confidence: 0.15,
      draftMenu: {
        ...defaultMenu,
        restaurant: { ...defaultMenu.restaurant, name: "Imported Menu Draft" },
        updatedAt: new Date().toISOString(),
      },
    });
  }
}
