import { eq, and, desc, isNotNull, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { menus } from "@/lib/db/schema";
import type { RestaurantMenu } from "@/types/menu";

export async function getLatestMenu(tenantId: string) {
  const result = await db
    .select()
    .from(menus)
    .where(
      and(eq(menus.tenant_id, tenantId), isNotNull(menus.published_at)),
    )
    .orderBy(desc(menus.version))
    .limit(1);
  return result[0] ?? null;
}

export async function getPublishedMenu(tenantId: string) {
  const result = await db
    .select()
    .from(menus)
    .where(and(eq(menus.tenant_id, tenantId), isNotNull(menus.published_at)))
    .orderBy(desc(menus.version))
    .limit(1);
  return result[0] ?? null;
}

/**
 * Patch a single dish's imageUrl in the latest menu payload (in-place, no new version).
 * Used by lazy image generation to persist URLs so subsequent loads skip the API call.
 */
export async function patchDishImageUrl(
  tenantId: string,
  dishId: string,
  imageUrl: string,
) {
  const menu = await getPublishedMenu(tenantId);
  if (!menu) return;

  const payload = menu.payload as RestaurantMenu;
  const dish = payload.dishes.find((d) => d.id === dishId);
  if (!dish || dish.imageUrl) return; // already has image

  dish.imageUrl = imageUrl;
  await db
    .update(menus)
    .set({ payload: payload as unknown as Record<string, unknown> })
    .where(eq(menus.id, menu.id));
}

/** Maximum number of menu versions to keep per tenant */
const MAX_VERSIONS = 10;

export async function createMenuVersion(tenantId: string, payload: unknown) {
  const latest = await getLatestMenu(tenantId);
  const nextVersion = latest ? latest.version + 1 : 1;

  const result = await db
    .insert(menus)
    .values({
      tenant_id: tenantId,
      payload,
      version: nextVersion,
      published_at: new Date(),
    })
    .returning();

  // Prune old versions beyond MAX_VERSIONS (fire-and-forget)
  pruneOldVersions(tenantId, nextVersion).catch(() => {});

  return result[0];
}

/** Get all available versions for a tenant (most recent first, max MAX_VERSIONS) */
export async function getMenuVersions(tenantId: string) {
  return db
    .select({
      id: menus.id,
      version: menus.version,
      published_at: menus.published_at,
      created_at: menus.created_at,
    })
    .from(menus)
    .where(eq(menus.tenant_id, tenantId))
    .orderBy(desc(menus.version))
    .limit(MAX_VERSIONS);
}

/** Get a specific version's full payload */
export async function getMenuByVersion(tenantId: string, version: number) {
  const result = await db
    .select()
    .from(menus)
    .where(and(eq(menus.tenant_id, tenantId), eq(menus.version, version)))
    .limit(1);
  return result[0] ?? null;
}

async function pruneOldVersions(tenantId: string, currentVersion: number) {
  const cutoff = currentVersion - MAX_VERSIONS;
  if (cutoff <= 0) return;
  await db
    .delete(menus)
    .where(
      and(
        eq(menus.tenant_id, tenantId),
        lt(menus.version, cutoff),
      ),
    );
}
