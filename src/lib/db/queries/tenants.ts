import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";

export async function getTenantBySlug(slug: string) {
  const result = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);
  return result[0] ?? null;
}

export async function getTenantsByOwnerId(ownerId: string) {
  return db
    .select()
    .from(tenants)
    .where(eq(tenants.owner_id, ownerId));
}

export async function getAllTenants() {
  return db.select().from(tenants);
}

export async function createTenant(data: {
  slug: string;
  name: string;
  owner_id: string;
  cuisine_type?: string;
  google_place_id?: string;
  rating?: string;
  address?: string;
  plan?: string;
  trial_ends_at?: Date;
}) {
  const result = await db.insert(tenants).values(data).returning();
  return result[0];
}

export async function deleteTenant(id: string) {
  await db.delete(tenants).where(eq(tenants.id, id));
}

export async function updateTenantOwner(id: string, ownerId: string) {
  const result = await db
    .update(tenants)
    .set({ owner_id: ownerId, updated_at: new Date() })
    .where(eq(tenants.id, id))
    .returning();
  return result[0];
}

export async function getTenantByStripeCustomerId(stripeCustomerId: string) {
  const result = await db
    .select()
    .from(tenants)
    .where(eq(tenants.stripe_customer_id, stripeCustomerId))
    .limit(1);
  return result[0] ?? null;
}

export async function updateTenant(
  id: string,
  data: Partial<{
    name: string;
    cuisine_type: string;
    google_place_id: string;
    rating: string;
    address: string;
    plan: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    settings: Record<string, unknown>;
  }>,
) {
  const result = await db
    .update(tenants)
    .set({ ...data, updated_at: new Date() })
    .where(eq(tenants.id, id))
    .returning();
  return result[0];
}
