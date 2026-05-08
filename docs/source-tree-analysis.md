# 源码树注解

> 单 Part 项目（monolith），关键目录与入口已标注

## 完整结构

```
carte-ai/
├── src/
│   ├── app/                              # ⚡ 入口：Next.js 16 App Router
│   │   ├── layout.tsx                    # 根 layout（字体、metadata、Tailwind 全局）
│   │   ├── page.tsx                      # / 产品落地页（Server Component）
│   │   ├── globals.css                   # Tailwind 入口
│   │   ├── favicon.ico
│   │   │
│   │   ├── demo/page.tsx                 # /demo 顾客 QR 体验外壳
│   │   ├── admin/page.tsx                # /admin 老板后台外壳
│   │   ├── poster/page.tsx               # /poster 可打印海报（async Server Component，编译期 QR）
│   │   │
│   │   └── api/                          # Route Handlers（5 个）
│   │       ├── menu/route.ts             # GET 返回静态 default menu
│   │       ├── recommend/route.ts        # POST 推荐（本地规则 → LLM 增强 → 失败降级）
│   │       ├── ingest/route.ts           # POST 上传菜单文件 → AI 提取草稿
│   │       └── google/places/
│   │           ├── search/route.ts       # POST 餐厅 Text Search
│   │           └── details/route.ts      # POST 餐厅详细信息
│   │
│   ├── components/                       # 🧩 客户端交互组件
│   │   ├── DemoExperience.tsx            # 507 行 顾客端主交互（语言/模式/限制/语音/推荐渲染）
│   │   └── AdminStudio.tsx               # 443 行 老板端（JSON 编辑器 + 文件上传 + Google 搜索）
│   │
│   ├── lib/                              # 🛠 业务逻辑
│   │   ├── menu.ts                       # 默认菜单加载 + parse + findDishes 工具
│   │   ├── validation.ts                 # Zod schemas（dish / menu / recommendationRequest）
│   │   ├── recommender.ts                # 327 行 本地规则推荐：硬过滤 → 打分 → 套餐组装
│   │   ├── llm.ts                        # 277 行 双 provider LLM 抽象（推荐 + 菜单提取）
│   │   ├── google-places.ts              # Google Places API v1 封装
│   │   ├── i18n.ts                       # 439 行 20 语言字典 + getLocalizedText / detectBrowserLanguage
│   │   ├── languages.ts                  # supportedLanguages 列表 + 方向（rtl/ltr）
│   │   └── format.ts                     # 价格 / 过敏原本地化展示
│   │
│   └── types/                            # 📐 强类型契约
│       ├── menu.ts                       # LanguageCode / MenuCategory / Allergen / DietaryTag / Dish / RestaurantMenu
│       └── recommendation.ts             # RecommendationMode / Request / Item / Response
│
├── data/
│   └── menu.json                         # 💾 演示菜单（多语言）—— 项目唯一"持久化数据"
│
├── docs/                                 # 📚 BMAD 输出（本次生成）
├── _bmad/                                # BMAD 安装根
├── _bmad-output/                         # planning-artifacts + implementation-artifacts 默认位置
├── .claude/skills/                       # 42 个 BMAD skill 入口
│
├── README.md                             # 安装 & API
├── DESIGN.md                             # 视觉设计语言
├── AGENTS.md                             # ⚠️ Placeholder，待重写
├── CLAUDE.md                             # `@AGENTS.md`
│
├── package.json                          # Next 16 / React 19 / Tailwind 4 / Zod 4
├── tsconfig.json                         # `@/*` → `src/*` 别名
├── next.config.ts                        # 仅配置 allowedDevOrigins（局域网调试）
├── postcss.config.mjs                    # @tailwindcss/postcss
├── eslint.config.mjs                     # eslint-config-next
├── .env.local.example                    # 环境变量模板
└── .env.local                            # 实际密钥（gitignored）
```

## 入口点

| 入口 | 类型 | 文件 |
|------|------|------|
| `/` | Server Component | `src/app/page.tsx` |
| `/demo` | Server → Client Component | `src/app/demo/page.tsx` 包裹 `DemoExperience` |
| `/admin` | Server → Client Component | `src/app/admin/page.tsx` 包裹 `AdminStudio` |
| `/poster` | Async Server Component | `src/app/poster/page.tsx`（编译期生成 QR） |
| `/api/*` | Route Handlers | `src/app/api/**/route.ts` |

## 关键目录用途

| 目录 | 用途 | 关键文件 |
|------|------|---------|
| `src/app/api/` | 5 个 Next.js Route Handler | `recommend/route.ts`（核心业务） |
| `src/lib/` | 业务逻辑层 | `recommender.ts`（本地规则）+ `llm.ts`（AI 抽象） |
| `src/components/` | 仅 2 个大型客户端组件 | 占 ~30% TSX 代码 |
| `src/types/` | 类型契约 | 与 `lib/validation.ts` 双向约束 |
| `data/` | 静态资产 | 仅 `menu.json` |

## 集成点

```
[Browser]
   │
   ├── 读 localStorage.carteai.menu  ─→  渲染 DemoExperience 菜单
   ├── 读 localStorage.carteai.language  ─→  i18n
   │
   └── HTTP
        │
        ├── POST /api/recommend
        │     ├── recommendFromMenu()  ←  本地规则（必跑）
        │     └── recommendWithLlm()   ←  LLM 增强（可降级）
        │             ├── Anthropic Foundry  (主路 / fetch)
        │             └── OpenAI            (兜底 / SDK)
        │
        ├── POST /api/ingest
        │     └── extractMenuDraftWithLlm()  ←  Anthropic 多模态（PDF/图片/文本）
        │
        ├── POST /api/google/places/search   ←  Google Places v1
        ├── POST /api/google/places/details  ←  Google Places v1
        │
        └── GET  /api/menu                   ←  返回 data/menu.json
```

## 注意事项

- **没有 `/r/[slug]` 路由**：海报指向 `https://carte-ai.link/r/${slug}` 但代码无对应处理
- **没有任何测试文件**：playwright 已装但 `*.test.*` / `*.spec.*` 为零
- **没有中间件**：`middleware.ts` 不存在 → 没有鉴权 / 速率限制 / 国际化路由
- **没有 `app/error.tsx` / `not-found.tsx`**：错误页全靠默认 fallback
