# CarteAI 架构文档（Brownfield 基线）

> 本文档记录**当前真实架构**，不是目标架构。目标架构由后续 BMAD 阶段（PRD → Architect）输出。

## 1. 执行摘要

- **形态**：Monolith Next.js 16 全栈应用，部署 Vercel
- **核心价值**：QR 扫码 → AI 推荐菜品（多语言）—— 老板上传菜单 → AI 提取 → 老板审稿 → 发布到本地
- **关键护栏**：LLM 不发明菜品 / 失败必降级 / 20 种语言强类型
- **MVP 边界**：单餐馆 / 无 DB / 无账号 / 无计费 / 无 `/r/[slug]` 路由

## 2. 技术栈

| 类别 | 技术 | 版本 | 决策理由 |
|------|------|------|---------|
| Framework | Next.js | 16.2.4 | App Router + Route Handlers 一站搞定全栈，Vercel 部署最顺 |
| View | React | 19.2.4 | Server Components 默认，Client 仅 2 个大组件 |
| Language | TypeScript | 5.x | 20 语言枚举 + 14 过敏原 + 14 饮食标签 强类型上锁 |
| Styling | Tailwind CSS | 4.x | 视觉是 inline utility class，无设计系统抽象 |
| Validation | Zod | 4.4.3 | 跨边界数据双层约束（类型 + 运行时） |
| Icons | lucide-react | 1.14 | 唯一 UI 库 |
| QR | qrcode | 1.5.4 | 海报页编译期生成 dataURL |
| LLM Primary | openai SDK | 6.35 | OpenAI Responses API |
| LLM Vision | Gemini API | — | Google Gemini 2.5 Flash（菜单 OCR） |
| External | Google Places API v1 | — | 餐厅 Identity 来源 |
| Test | playwright | 1.59 | ⚠️ 已装但无用例 |
| Deploy | Vercel | — | 推 main 自动部署 |

## 3. 架构模式

**Next.js App Router 全栈分层**：

```
┌────────────────────────────────────────────┐
│ Browser (Client Components)                │
│   - DemoExperience.tsx (顾客)              │
│   - AdminStudio.tsx (老板)                 │
│   - localStorage: carteai.menu / language  │
└──────────────┬─────────────────────────────┘
               │ HTTP (Next.js Route Handlers)
┌──────────────▼─────────────────────────────┐
│ Server Layer (src/app/api/*)               │
│   - /api/recommend  ── 核心业务            │
│   - /api/ingest     ── 文件 → 草稿         │
│   - /api/menu       ── 静态菜单            │
│   - /api/google/places/{search,details}    │
└──────────────┬─────────────────────────────┘
               │
┌──────────────▼─────────────────────────────┐
│ Business Logic (src/lib/*)                 │
│   - recommender.ts  ── 纯函数：硬过滤+打分 │
│   - llm.ts          ── 双 provider 抽象    │
│   - google-places.ts── 外部 API 封装       │
│   - i18n.ts         ── 20 语言字典         │
│   - validation.ts   ── Zod schemas         │
└──────────────┬─────────────────────────────┘
               │
        ┌──────┼──────┐
        ▼      ▼      ▼
   data/    OpenAI  Gemini    Google
   menu.json SDK     Vision    Places
```

## 4. 数据架构

详见 [data-models.md](./data-models.md)。要点：

- **当前无 DB**。唯一持久化是 `data/menu.json`（构建时打包）+ 浏览器 `localStorage`
- **类型契约**：`RestaurantMenu` / `Dish` / `RecommendationRequest` 在 `src/types/` 定义
- **校验策略**：所有跨边界 JSON 用 Zod `.parse()` 强校验，失败抛 400

## 5. API 设计

详见 [api-contracts.md](./api-contracts.md)。要点：

- 5 个 Route Handler，全部 POST 或 GET，无 auth
- 业务原则：**永不返回 5xx**。LLM/外部失败时优雅降级到本地规则或 default menu
- `/api/recommend` 是核心：本地规则永远先跑，LLM 只增强候选子集
- `/api/ingest` 是次核心：JSON 直接 parse，PDF/图片走 Gemini Vision OCR + OpenAI 结构化

## 6. 推荐引擎设计（核心业务逻辑）

**位置**：`src/lib/recommender.ts` + `src/lib/llm.ts`

### 6.1 两层流水线

```
RecommendationRequest
        │
        ▼
┌───────────────────────────────────┐
│  Layer 1: 本地规则（必跑）          │
│  recommendFromMenu()               │
│                                    │
│  ① passesHardFilters()             │
│     - 不在售直接 out               │
│     - 超过 maxSpiceLevel out       │
│     - 命中 excludedAllergens out   │
│     - excludedTags 过滤            │
│  ② scoreDish() 多模式打分          │
│     - 基础分 10                    │
│     - +signature/popular/good_value│
│     - 预算贴近 +12，超额 -1/100¢   │
│     - mode 加权（cheap/healthy ...)│
│  ③ 排序 + 取 top 3                 │
│  ④ buildSet() 套餐组合（可选）     │
└───────────────┬───────────────────┘
                │ candidates 子集
                ▼
┌───────────────────────────────────┐
│  Layer 2: LLM 增强（可选）         │
│  recommendWithLlm()                │
│                                    │
│  - 只看本地筛出的 candidates       │
│  - System prompt 强约束：          │
│    "Never invent dishes/prices"    │
│  - 输出严格 JSON schema            │
│  - 任何失败 → 返回 Layer 1 结果   │
└───────────────────────────────────┘
```

### 6.2 安全护栏

LLM system prompt 锁了 6 条：

1. 只能从提供的 candidate list 推荐
2. 永不发明菜品 / 价格 / 食材 / 过敏原 / 卡路里 / 在售状态
3. 过敏数据缺失时必须提示找服务员核对
4. 推荐保持 short, practical, friendly
5. 必须遵守 budget / 饮食限制 / 辣度
6. 仅输出 valid JSON

### 6.3 模式权重（关键产品逻辑）

| Mode | 主要加权字段 |
|------|-------------|
| `cheap` | `priceCents ≤ 1000` (+15) / `good_value` (+10) / `portionScore ≥ 2` (+5) |
| `healthy` | `low_calorie` (+12) / `light` (+10) / `high_protein` (+8) / `kcal ≤ 650` (+8) |
| `first_time` | `popular` (+12) / `signature` (+10) / `spiceLevel ≤ 1` (+4) |
| `signature` | `signature` (+15) / `popular` (+8) |
| `sharing` | `portionScore = 3` (+10) / `category=combo` (+12) / starter+side (+6) |
| `not_sure` | `popular` (+12) / `good_value` (+8) / `signature` (+8) |

`marginPriority = 3` 全模式 +3，`portionScore = 3` 全模式 +5 —— 这两个字段是**餐馆侧的优化杠杆**，目前 UI 未暴露，是隐藏的产品差异化。

## 7. 部署架构

```
GitHub main ──push──▶ Vercel build ──▶ Vercel Edge Network
                          │
                          ├─ env vars from Vercel dashboard
                          └─ static data/menu.json 打包进 bundle
```

- 无 staging 环境
- 无健康检查 / 监控埋点
- 无错误聚合（Sentry / 类似）
- 域名：`carte-ai.link`（按 README 与 .env 推断）

## 8. 测试策略（现状）

❌ **完全空白**。Playwright 已装（devDep），但 `find . -name "*.test.*"` 零结果。

**建议起点**（待 PRD/Architect 决策）：

- 单测：`lib/recommender.ts`（纯函数最易测）
- 集成测：5 个 API endpoint 的 happy path + 失败降级
- E2E：扫 demo + 基础推荐链路 + 老板上传 JSON 链路

## 9. 关键风险与债务

| 风险 | 严重 | 说明 |
|------|------|------|
| 无持久化 | 🔴 | 老板换设备即丢菜单，根本没法上线 |
| 无鉴权 | 🔴 | `/admin` 任何人能进，`/api/ingest` 任何人能调（LLM 烧钱风险） |
| 无速率限制 | 🔴 | DDoS 直接打爆 LLM 配额 |
| 无 `/r/[slug]` 路由 | 🟡 | QR 海报已经印出来的话，扫码会 404 |
| 单餐馆 | 🟡 | 多租户改造影响数据模型 + 路由 + 鉴权 全部 |
| 无 CI / 无测试 | 🟡 | 重构信心低 |
| `AGENTS.md` 是占位 | 🟢 | 不影响业务，但影响 AI 协作质量 |
| `marginPriority` 未暴露 | 🟢 | 产品差异化卖点没用上 |

## 10. 架构演进方向（待 PRD 确认）

下一阶段建议优先解决：

1. **持久化层** —— Vercel Postgres / Neon，引入 `tenants` + `menus` 两张表
2. **多租户路由** —— `/r/[slug]` 顾客端 + `/admin/[slug]` 老板端
3. **鉴权** —— Auth.js / Clerk，老板端必登录，顾客端无需账号
4. **速率限制** —— Upstash Ratelimit，特别是 `/api/ingest` 和 `/api/recommend`
5. **观测** —— 至少 Vercel Analytics + Sentry + LLM 调用日志（用 `recommendations_log` 表）
6. **设计系统** —— 引入 shadcn/ui，把 inline utility 收敛到组件库
