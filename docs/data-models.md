# 数据模型

> ⚠️ 当前**没有数据库**。所有数据来源是静态 JSON + 浏览器 localStorage。本文档记录的是**类型契约**与**运行时存储位置**。

## 概览

| 实体 | 持久层 | 文件/键 | 校验 |
|------|--------|---------|------|
| `RestaurantMenu` | 文件系统 | `data/menu.json` | `restaurantMenuSchema` (Zod) |
| `RestaurantMenu`（覆盖） | 浏览器 localStorage | `carteai.menu` | 同上，加载时 try/catch |
| 用户语言偏好 | 浏览器 localStorage | `carteai.language` | 软校验（落不到字典就回退） |
| `RecommendationRequest` | 仅 in-flight（HTTP body） | — | `recommendationRequestSchema` |
| `RecommendationResponse` | 不落地 | — | 类型只在出口约束 |
| Google Places 元数据 | 不落地，仅老板临时选择 | — | — |

---

## 1. `RestaurantMenu` —— 餐馆菜单根模型

**位置**：`src/types/menu.ts` + `src/lib/validation.ts`

```ts
interface RestaurantMenu {
  restaurant: {
    id: string
    slug: string                 // URL 友好；目前未启用 /r/[slug] 路由
    name: string
    cuisine: string
    city: string
    currency: "EUR"              // 字面量类型，单货币
    languages: LanguageCode[]    // 19 种支持的语言子集
    welcome: LocalizedText       // zh / fr / en 必填，其余可选
  }
  dishes: Dish[]                 // 至少 1 条
  updatedAt: string              // ISO date
}
```

### 1.1 `Dish`

```ts
interface Dish {
  id: string                     // kebab-case 业务 ID（如 "chicken-bowl"）
  category: "starter" | "main" | "side" | "dessert" | "drink" | "combo"
  name: LocalizedText            // { zh, fr, en } 必填
  description: LocalizedText
  priceCents: number             // 整数，分（避免浮点）
  currency: "EUR"
  ingredients: string[]
  allergens: Allergen[]          // 见下方 14 种 + "unknown"
  dietaryTags: DietaryTag[]      // 见下方 14 种
  caloriesKcal?: number          // 可选；推荐引擎缺省时不输出健康注释
  spiceLevel: 0 | 1 | 2 | 3      // 0 = 不辣
  available: boolean             // 推荐前硬过滤
  imageUrl?: string              // 当前未在 UI 展示
  marginPriority?: 1 | 2 | 3     // 餐馆希望多卖（推荐打分 +3）
  portionScore?: 1 | 2 | 3       // 大份（推荐打分 +5；分享模式 +10）
}
```

### 1.2 枚举字段

```ts
LanguageCode  = fr | en | zh | zh-Hant | es | it | de | pt | ar | ja | ko | ru | tr | nl | pl | uk | ro | vi | th | hi    // 共 20 个
MenuCategory  = starter | main | side | dessert | drink | combo
Allergen      = gluten | crustaceans | eggs | fish | peanuts | soy | milk | nuts | celery | mustard | sesame | sulphites | lupin | molluscs | unknown
DietaryTag    = vegetarian | vegan | halal_possible | contains_pork | contains_beef | contains_seafood | high_protein | low_calorie | spicy | signature | popular | good_value | light | comfort_food
```

### 1.3 `LocalizedText`

```ts
type LocalizedText = Partial<Record<LanguageCode, string>> & {
  zh: string                     // 中文必填
  fr: string                     // 法语必填（首发市场）
  en: string                     // 英文必填
}
```

**含义**：任何菜品名 / 描述 / 欢迎语**至少**有 zh/fr/en 三语，其他语言按需补充，找不到时 `getLocalizedText` 回退到 `en`。

---

## 2. `RecommendationRequest` / `RecommendationResponse`

**位置**：`src/types/recommendation.ts`

### 2.1 Request

```ts
interface RecommendationRequest {
  language: LanguageCode
  budgetCents?: number
  mode: "not_sure" | "cheap" | "healthy" | "first_time" | "signature" | "sharing"
  partySize: 1 | 2 | 3 | 4
  excludedTags: DietaryTag[]
  excludedAllergens: Allergen[]
  maxSpiceLevel?: 0 | 1 | 2 | 3
  userText?: string              // ≤ 500 字符，给 LLM 当 hint
}
```

### 2.2 Response Item

```ts
interface RecommendationItem {
  id: string                     // "rec-1" / "rec-set-1" / "rec-ai-1"
  type: "single_dish" | "combo" | "set"
  dishIds: string[]              // 引用 Dish.id
  title: string                  // 已本地化
  totalPriceCents: number
  reason: string                 // 已本地化（本地模板 / LLM 文案）
  healthNote?: string
  budgetNote?: string
  allergenWarning?: string
  confidence: number             // 0~1
}
```

---

## 3. 浏览器 localStorage 键

| 键名 | 类型 | 写入方 | 读取方 |
|------|------|--------|--------|
| `carteai.menu` | `RestaurantMenu` JSON 字符串 | `AdminStudio.publishLocal()` | `DemoExperience` 启动时 + `AdminStudio` 启动时 |
| `carteai.language` | `LanguageCode` | `DemoExperience.changeLanguage()` | `DemoExperience` 启动时 |

**严重限制**：

- 单设备 / 单浏览器 / 同 origin —— 换设备即丢
- 没有版本号字段，未来加字段时只能依赖 Zod `safeParse` 失败回退 default
- 老板与顾客**共用同一命名空间** —— 在同一台机器上互相覆盖

---

## 4. 状态文件（BMAD 自身产出，不是业务数据）

`docs/project-scan-report.json` —— BMAD 文档化扫描的进度状态，可重启续跑。

---

## 5. 待规划：未来真正的数据模型

下一阶段（持久化 + 多租户）需要至少：

| 表 / 集合 | 字段（草案） | 备注 |
|-----------|-------------|------|
| `tenants` | id, slug, name, owner_email, plan, created_at | 餐馆租户 |
| `menus` | id, tenant_id, payload (RestaurantMenu JSON), version, published_at | 含历史版本 |
| `recommendations_log` | id, tenant_id, request (jsonb), response (jsonb), provider, latency_ms, ts | 用于评估 LLM 质量 / 成本 |
| `ingestion_jobs` | id, tenant_id, file_meta, status, draft (jsonb), confidence | 上传审稿流水 |
| `users`（可选） | id, tenant_id, email, role | 多用户老板团队场景 |

存储选型建议（待 Architect 决策）：

- **快路径**：Vercel Postgres（Neon）/ Supabase —— Next.js 生态最顺手
- **菜单 JSON 大字段**：直接 jsonb 列，校验在应用层 Zod
- **租户隔离**：行级 + slug-based 路由（`/r/[slug]`）
