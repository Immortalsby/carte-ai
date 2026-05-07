# API 契约

> 5 个 Route Handler，全部位于 `src/app/api/`

---

## 1. `GET /api/menu`

**用途**：返回静态默认菜单（`data/menu.json` 经 Zod 校验后输出）

**请求**：无 body

**响应 200**：`RestaurantMenu` 完整对象

```jsonc
{
  "restaurant": { "id": "demo-restaurant", "slug": "demo-bistro", "name": "Demo Bistro", ... },
  "dishes": [ { "id": "chicken-bowl", "category": "main", ... } ],
  "updatedAt": "2026-05-04T00:00:00.000Z"
}
```

**实现**：`src/app/api/menu/route.ts`（6 行，单纯 `getDefaultMenu()`）

**待改进**：当前所有调用方都返回同一份菜单。后续按租户 / slug 区分时，需扩展为 `GET /api/menu/[slug]` 或加 query。

---

## 2. `POST /api/recommend`

**用途**：核心业务 —— 给定语言、预算、模式、过敏原过滤，返回 1~4 条推荐

**请求 body**（`recommendationRequestSchema` 校验）：

```ts
{
  language: LanguageCode             // 默认 "zh"
  budgetCents?: number               // 可选预算（分）
  mode: "not_sure" | "cheap" | "healthy" | "first_time" | "signature" | "sharing"  // 默认 not_sure
  partySize: 1 | 2 | 3 | 4           // 默认 1
  excludedTags: DietaryTag[]
  excludedAllergens: Allergen[]
  maxSpiceLevel?: 0 | 1 | 2 | 3
  userText?: string                  // 最多 500 字符
  menu?: RestaurantMenu              // 可选：覆盖默认菜单（用于 admin 预览）
}
```

**响应 200 — 三种形态**：

| 形态 | `fallbackUsed` | `provider` | 触发条件 |
|------|---------------|------------|---------|
| 本地规则推荐 | `true` | — | 没配 LLM key 或所有 LLM 调用都失败 |
| AI 增强推荐 | `false` | `"anthropic-foundry"` | Anthropic Foundry 配置完整且调用成功 |
| AI 增强推荐 | `false` | `"openai"` | Anthropic 未配 / 失败，OpenAI key 存在且成功 |

```ts
{
  recommendations: Array<{
    id: string                   // "rec-1" / "rec-set-1" / "rec-ai-1" 等
    type: "single_dish" | "combo" | "set"
    dishIds: string[]
    title: string
    totalPriceCents: number
    reason: string               // 多语言推理（本地化模板 或 LLM 文案）
    healthNote?: string
    budgetNote?: string
    allergenWarning?: string
    confidence: number           // 0.55 ~ 0.96
  }>
  fallbackUsed: boolean
  safetyNotice: string           // 强制提醒"过敏请向员工二次确认"
  provider?: "anthropic-foundry" | "openai"   // 仅 LLM 路径返回
  noExactMatch?: boolean         // 仅本地路径：硬过滤后无结果时为 true
}
```

**响应 400**：`{ error: "Invalid recommendation request", detail: "..." }`

**关键设计**：`recommend/route.ts` 总是先跑本地规则；LLM 失败 try/catch 后直接返回本地结果，永不 5xx。

---

## 3. `POST /api/ingest`

**用途**：老板上传菜单文件 → AI 提取草稿 → 老板审稿后再发布

**请求**：`multipart/form-data`，字段名 `file`

**支持类型**：

| 类型 | 处理路径 |
|------|---------|
| `.json` / `application/json` | 直接 `JSON.parse` + Zod 校验 |
| `text/*` / `csv` / `tsv` / `txt` | LLM 文本提取（Anthropic Foundry） |
| `image/*` | LLM 多模态（base64 image block） |
| `application/pdf` | LLM 多模态（base64 document block） |
| 其他 | 返回 `draft_needs_review` 占位 |

**响应 200 — 三种状态**：

```ts
{
  status: "draft_ready" | "draft_needs_review",
  file: { name: string, type: string, size: number },
  message: string,
  confidence: 0.25 | 0.78 | 0.98,
  draftMenu: RestaurantMenu     // 永远返回一份可用草稿（即使是 fallback）
}
```

| confidence | 含义 |
|-----------|------|
| 0.98 | JSON 直接 parse 成功 |
| 0.78 | LLM 提取并通过 Zod 校验 |
| 0.25 | 提取失败，返回 default menu 改名为 "Imported Menu Draft" |

**响应 400**：未上传文件

**关键设计**：永不阻塞老板 —— 即使 OCR 失败也给出草稿让其手改。

---

## 4. `POST /api/google/places/search`

**用途**：在 Google Places 找到老板的实体餐馆

**请求 body**：

```ts
{
  query: string                  // 餐馆名 / 地址 关键词
  languageCode?: string          // 默认 "fr"
  regionCode?: string            // 默认 "FR"
}
```

**响应 200**：

```ts
{
  configured: boolean            // false 时表示 GOOGLE_MAPS_API_KEY 未配
  places: Array<{
    id: string
    resourceName?: string
    name: string
    address?: string
    googleMapsUri?: string
    websiteUri?: string
    rating?: number
    userRatingCount?: number
  }>
  message?: string               // 仅 configured=false 时
}
```

**底层调用**：`POST https://places.googleapis.com/v1/places:searchText`，限 `includedType: "restaurant"`，`pageSize: 5`。

---

## 5. `POST /api/google/places/details`

**用途**：拿到 placeId 后取详细元数据（用于填充餐馆 identity）

**请求 body**：

```ts
{
  placeId: string
  languageCode?: string          // 默认 "fr"
}
```

**响应 200**：

```ts
{
  configured: boolean
  place: {
    id, resourceName, name, address, googleMapsUri, websiteUri, rating, userRatingCount,
    phone?: string,              // 优先 international，回退 national
    types: string[],
    photos: Array<{ name, widthPx, heightPx, authorAttributions }>
  } | null
  message?: string
}
```

**约束**（README 明确）：只取公开元数据。如需读取 Google 维护的菜单条目，老板必须连接自己的 **Google Business Profile** 并授权。**永不爬取 Google Maps 页面。**

---

## 跨 endpoint 共性

- 所有 endpoint 都在 Edge / Node 默认运行时（未显式声明 `runtime`）
- 所有错误均返回 200 + 业务字段 或 400 + JSON，**没有 5xx**（业务上故意让 LLM/外部失败优雅降级）
- 没有任何鉴权 / 速率限制 / CORS 配置
- 没有日志埋点（生产观测靠 Vercel 默认）

## 待补强

| 项 | 优先级 | 说明 |
|---|-------|------|
| `GET /api/menu/[slug]` 多租户 | 高 | 当前所有调用都拿同一菜单 |
| `POST /api/menu/publish` 持久化 | 高 | 老板审稿后只能存 localStorage |
| 鉴权 middleware | 高 | `/admin/*` 与 `/api/ingest` 必须保护 |
| 速率限制 | 中 | LLM 成本与滥用防御 |
| 结构化日志 | 中 | 当前完全黑盒 |
| OpenAPI / 类型导出 | 低 | 前后端类型已共享，外部消费者尚无 |
