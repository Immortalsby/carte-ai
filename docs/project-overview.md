# CarteAI 项目总览

> 生成时间：2026-05-04 · 扫描深度：Deep Scan · 类型：Brownfield Monolith

## 项目目的

CarteAI 是一款面向欧洲（首发法国 / EUR）餐馆的 **AI 菜单点餐 SaaS**：顾客用手机扫桌上 QR → 进入未来感界面 → 用预设按钮（不打字）+ AI 推荐菜品；老板后台上传菜单（JSON/PDF/图片）、连接 Google Places 选定餐厅身份、生成可打印 QR 海报。

核心差异化：

- **AI 不发明菜品** —— LLM 只在本地规则筛出的候选子集里再排序、写理由，绝不虚构价格 / 过敏原 / 卡路里
- **预设按钮优先** —— "第一次来 / 10 欧以内 / 招牌菜 / 健康 / 分享" 直接出菜，文字输入是次级路径
- **多语言** —— 20 种语言强类型，浏览器自动检测
- **无数据库** —— MVP 用静态 JSON + localStorage，演示和小餐馆够用

## 执行摘要

| 维度 | 现状 |
|------|------|
| 阶段 | MVP / Demo（已部署 Vercel，已接 LLM） |
| 仓库形态 | Monolith Next.js App Router |
| 总代码量 | ~3000 行 TS/TSX（src/） |
| 多语言 | 20 种语言文案字典（fr / en / zh 必填，其余 fallback） |
| 推荐引擎 | 本地规则（必跑） + LLM（增强，可降级） |
| 数据持久化 | ❌ 无 DB；静态 JSON + 浏览器 localStorage |
| 多租户 | ❌ 单餐馆 demo |
| 计费 / 账号 | ❌ 未实现 |

## 技术栈速览

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | Next.js | 16.2.4 | App Router，TS 配置 |
| 视图 | React | 19.2.4 | Server + Client Components 混用 |
| 语言 | TypeScript | 5.x | 严格类型，`@/*` 路径别名 |
| 样式 | Tailwind CSS | 4.x | PostCSS 插件方式集成 |
| 校验 | Zod | 4.4.3 | 菜单 / 推荐请求双层校验 |
| 图标 | lucide-react | 1.14 | UI 图标库 |
| QR | qrcode | 1.5.4 | 海报页生成二维码 dataURL |
| LLM | openai | 6.35 | OpenAI 兜底 provider |
| LLM 主路 | fetch (Anthropic Foundry HTTP) | — | 不走官方 SDK，直接 POST `/v1/messages` |
| 地点 | Google Places API v1 | — | Text Search + Place Details |
| E2E | playwright | 1.59 | 已安装，未见测试用例 |
| 部署 | vercel | 53.1 | CLI 已加 devDep |

## 架构类型

- **形态**：Monolith
- **架构风格**：Next.js 全栈（App Router）—— 同一仓库内 Server Components 渲染页面 + Route Handlers 提供 API + Client Components 处理交互
- **通信模式**：浏览器 ↔ Next.js Route Handler ↔ 外部 LLM / Google Places
- **数据流向**：单向 —— 顾客端读 `localStorage.carteai.menu`（fallback 到 `data/menu.json`），调 `/api/recommend` 拿 AI 推荐

## 仓库结构

```
carte-ai/
├── src/
│   ├── app/              # Next.js 16 App Router（页面 + API）
│   │   ├── api/          # Route Handlers（5 个 endpoint）
│   │   ├── demo/         # 顾客 QR 扫码端
│   │   ├── admin/        # 老板后台
│   │   ├── poster/       # 可打印海报（含动态 QR）
│   │   └── page.tsx      # 产品落地页
│   ├── components/       # 客户端交互组件（2 个：Demo / Admin）
│   ├── lib/              # 业务逻辑（推荐 / LLM / i18n / Places ...）
│   └── types/            # 强类型定义（Menu / Recommendation）
├── data/menu.json        # 演示菜单（Demo Bistro 多语言）
├── docs/                 # ← 本次 BMAD 文档输出位置
├── _bmad/                # BMAD 安装目录（核心 + bmm 模块）
├── .claude/skills/       # 42 个 BMAD skill
└── _bmad-output/         # 计划/实现产物输出（Brief / PRD / Stories）
```

## 关键文档导航

- 详细技术决策：`architecture.md`
- 源码树注解：`source-tree-analysis.md`
- 5 个 API 契约：`api-contracts.md`
- 数据模型（Menu / Recommendation）：`data-models.md`
- UI 组件清单：`component-inventory.md`
- 本地开发与部署：`development-guide.md`
- 主入口：`index.md`

## 已发现的项目级 README/文档

- `README.md` —— 安装、API endpoint 列表、AI 提供商说明
- `DESIGN.md` —— 视觉设计语言（深色 + emerald/cyan，AI Concierge 风）
- `CLAUDE.md` —— `@AGENTS.md` 引用
- `AGENTS.md` —— 一句话提醒"Next.js 有 breaking changes，写代码前看 node_modules 里的 docs"

## 我看到的"差点啥"清单（待 PRD 拍板）

1. **`/r/[slug]` 路由不存在** —— 海报里 QR 已经指 `https://carte-ai.link/r/${slug}`，但代码里没这个 route，目前只有单一 `/demo`
2. **菜单只存 localStorage** —— 换设备/换浏览器即丢，无法真正"上线"
3. **没有用户/餐馆账号体系** —— 老板和顾客是同一个 `localStorage` 命名空间
4. **没有计费 / 订阅** —— 商业模型没实现
5. **`marginPriority` 字段** —— 类型定义了但产品上未做差异化展示（餐馆推高利润菜的能力被埋没）
6. **`AGENTS.md` 仍是 placeholder** —— 该写真正的协作约定
