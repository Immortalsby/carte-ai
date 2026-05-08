import { eq, gte, and, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { ocr_uploads } from "@/lib/db/schema";

/** Count uploads for a tenant since the start of today (UTC) */
export async function countTodayUploads(tenantId: string): Promise<number> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const result = await db
    .select({ count: count() })
    .from(ocr_uploads)
    .where(
      and(
        eq(ocr_uploads.tenant_id, tenantId),
        gte(ocr_uploads.uploaded_at, todayStart),
      ),
    );
  return result[0]?.count ?? 0;
}

/** Record an OCR upload for a tenant */
export async function recordUpload(tenantId: string) {
  await db.insert(ocr_uploads).values({ tenant_id: tenantId });
}
