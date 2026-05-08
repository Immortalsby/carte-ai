import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  timestamp,
  jsonb,
  numeric,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ─── Tenants ────────────────────────────────────────────

export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 63 }).notNull().unique(),
    name: text("name").notNull(),
    cuisine_type: text("cuisine_type"),
    google_place_id: text("google_place_id"),
    rating: numeric("rating"),
    address: text("address"),
    owner_id: text("owner_id").notNull(),
    plan: text("plan").notNull().default("trial"),
    trial_ends_at: timestamp("trial_ends_at", { withTimezone: true }),
    stripe_customer_id: text("stripe_customer_id"),
    stripe_subscription_id: text("stripe_subscription_id"),
    settings: jsonb("settings").default({}),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_tenants_slug").on(table.slug),
  ],
);

// ─── Menus ──────────────────────────────────────────────

export const menus = pgTable(
  "menus",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    payload: jsonb("payload").notNull(),
    version: integer("version").notNull().default(1),
    published_at: timestamp("published_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_menus_tenant_version").on(table.tenant_id, table.version),
  ],
);

// ─── Dish Images ────────────────────────────────────────

export const dish_images = pgTable(
  "dish_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    canonical_tag: text("canonical_tag").unique(),
    image_url: text("image_url").notNull(),
    source: text("source").notNull(), // 'ai_generated' | 'manual'
    attribution: text("attribution"),
    prompt_hash: text("prompt_hash"),
    status: text("status").notNull().default("active"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_dish_images_canonical_tag").on(table.canonical_tag),
  ],
);

// ─── Recommendations Log ────────────────────────────────

export const recommendations_log = pgTable(
  "recommendations_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    request: jsonb("request").notNull(),
    response: jsonb("response").notNull(),
    provider: text("provider"),
    latency_ms: integer("latency_ms"),
    allergens_filtered: text("allergens_filtered").array(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_recommendations_log_tenant").on(table.tenant_id, table.created_at),
  ],
);

// ─── Analytics Events ───────────────────────────────────

export const analytics_events = pgTable(
  "analytics_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    event_type: text("event_type").notNull(),
    payload: jsonb("payload").default({}),
    session_id: text("session_id"),
    language: text("language"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_analytics_events_tenant_type").on(
      table.tenant_id,
      table.event_type,
      table.created_at,
    ),
  ],
);

// ─── OCR Uploads (daily limit tracking) ────────────────

export const ocr_uploads = pgTable(
  "ocr_uploads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    uploaded_at: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_ocr_uploads_tenant_date").on(table.tenant_id, table.uploaded_at),
  ],
);

// ─── LLM Usage ──────────────────────────────────────────

export const llm_usage = pgTable(
  "llm_usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenant_id: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    month: text("month").notNull(),
    call_count: integer("call_count").notNull().default(0),
    token_count: integer("token_count").notNull().default(0),
    cost_cents: integer("cost_cents").notNull().default(0),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_llm_usage_tenant_month").on(table.tenant_id, table.month),
  ],
);
