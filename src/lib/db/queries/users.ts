import { db } from "@/lib/db";
import { user } from "@/lib/db/auth-schema";
import { tenants } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function getAllUsersWithTenants() {
  const users = await db.select().from(user);
  const allTenants = await db.select().from(tenants);

  const tenantsByOwner = new Map<string, typeof allTenants>();
  for (const t of allTenants) {
    const existing = tenantsByOwner.get(t.owner_id) ?? [];
    existing.push(t);
    tenantsByOwner.set(t.owner_id, existing);
  }

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    emailVerified: u.emailVerified,
    approved: u.approved,
    createdAt: u.createdAt,
    tenants: tenantsByOwner.get(u.id) ?? [],
  }));
}
