---
title: "Product Brief Distillate: CarteAI"
type: llm-distillate
source: "product-brief-carte-ai.md"
created: "2026-05-04"
purpose: "Token-efficient context for downstream PRD creation"
---

# CarteAI Product Brief Distillate

## Scope Signals (In / Out / Maybe for Phase 1)

### Confirmed IN
- `/r/[slug]` 餐馆专属推荐页 — 核心产品入口
- 菜单 OCR 提取（拍照/PDF→结构化）— 已有 Anthropic multimodal 实现
- 本地规则引擎 + LLM 增强双层推荐 — 已实现，GPT-4.1-nano
- 19 语言 i18n + RTL — 已实现，zh/fr/en 为必填
- 14 种 EU 过敏原标注 — 已内置类型系统
- 文化感知模式切换（外客翻译模式 vs 同文化组菜模式）— 核心差异化
- `marginPriority` 高利润菜推送开关 — 老板付费核心理由
- QR 海报生成（真实二维码）+ 门口 "AI Menu · 19 Languages" 标识
- 基础埋点：扫码量/推荐查看/语言分布/停留时长
- 餐后柔性采纳追踪弹窗（"您点了推荐菜吗？是/否"）
- `contact@carte-ai.link` 邮件咨询入口（Cloudflare Email Routing）
- 基础老板鉴权（admin 端）
- 速率限制 + 按餐馆 LLM 成本封顶
- 核心 E2E 测试（Playwright — 已装未用）
- 餐后柔性好评引导（非侵入式，推荐页底部小提示，不要太突兀）

### Confirmed OUT (Phase 1)
- 自助注册 / onboarding 向导 — 推到 Phase 2
- Stripe 计费集成 — Phase 2
- 完整 analytics dashboard — Phase 2
- OAuth / SSO — Phase 2
- POS 集成 — Phase 2
- 多语言海报模板定制 — 非优先
- 在线点单/支付功能 — 不在 CarteAI 定位范围

### Maybe / Phase 1.5
- WhatsApp Agent（Hermes + WhatsApp Business API）— 菜单 CRUD 对话式管理
- Pro 阶梯定价解锁

## Requirements Hints

- **菜单录入必须零摩擦**：法国小老板极度抗拒登录后台系统。Phase 1 用白手套（创始人帮录入）+ Google Places 搜索抓取菜单 + 老板确认。Phase 1.5 靠 WhatsApp 对话管理
- **推荐结果 3 秒内出现**：扫码 → 选模式 → 3~4 道推荐，全程 10 秒内
- **信心评分展示**：推荐菜附带 confidence score，用户可见
- **本地化理由**：推荐需附带简短理由（为什么推荐这道菜），使用顾客语言
- **价格必须展示**：推荐中包含价格信息
- **过敏原查询存档**：每次过敏原查询自动存档，可作为 EU 1169/2011 合规审计证据
- **LLM 降级透明**：LLM 不可用时自动降级到本地规则，体验不中断，不告知用户
- **成本封顶机制**：Starter 超 5000 扫/月自动降级纯本地规则；Pro 有软上限 + 通知
- **数据隐私**：仅采集匿名行为数据（扫码/语言/推荐点击），不收集 PII，符合 GDPR 匿名数据原则
- **好评引导时机**：应在用餐后而非用餐前——推荐页底部小提示，不突兀

## Technical Context (Existing Codebase)

- **框架**: Next.js 16.2.4 + React 19 + TypeScript 5 + Tailwind 4
- **LLM 提供商**: Anthropic Foundry (主) + OpenAI SDK (兜底) + 本地规则（终极降级）
- **数据存储**: 当前 `data/menu.json` (静态) + `localStorage` (运行时) — 无数据库，需升级到持久化
- **部署**: Vercel
- **现有 API**: 5 个 endpoint（recommend, ingest, poster, menu, google-places-search）
- **现有组件**: DemoExperience.tsx (507行, 顾客端) + AdminStudio.tsx (443行, 老板端)
- **测试**: Playwright 已安装但零测试用例
- **CI/CD**: 无
- **鉴权**: 无
- **租户**: 单租户 — 需要升级到多租户

## Detailed User Scenarios

### 场景 A: 外国游客在中餐馆
- 美国游客进入巴黎中餐馆 → 扫桌上 QR → 浏览器语言 en → 进入"翻译+入门推荐"模式
- 点"第一次来" → 勾"不辣" → 3 秒出 3 道菜（英文菜名+中文原名+理由+价格+过敏原）

### 场景 B: 中国人在中餐馆（文化匹配模式）
- 浏览器语言 zh + 餐馆菜系 Chinese → 自动切换"组菜顾问"模式
- 不翻译菜名 → 直接问"几个人？有忌口吗？不吃香菜？" → 推荐热菜凉菜搭配

### 场景 C: 法国人在印度餐馆
- 浏览器语言 fr + 餐馆菜系 Indian → "翻译+入门推荐"模式
- 点"≤10€" + 勾"素食" → 推荐适合入门的素食印度菜

### 场景 D: 老板日常更新（Phase 1.5）
- 老板给 WhatsApp 机器人发消息："今天牛排没了" → AI 理解并更新菜单

## Competitive Intelligence

- **Sunday** (法国): 核心是支付，不做推荐。€3B 估值后裁员 → 验证扫码场景但纯支付天花板明显
- **Zenchef** (法国/15国): 运营 SaaS（预订/CRM），不涉及推荐层。2024 被 TheFork 收购
- **Menutech** (EU): 过敏原标注+翻译 €15-180/月，只做合规不做推荐
- **Menu-Order-AI** (美国): AI 推荐但仅英语、仅美国市场
- **西欧没有直接竞品**：AI 推荐 + 多语言 + 文化感知的餐桌级产品在欧洲尚无

## Rejected Ideas & Rationale

- **在线点单/支付集成** — 不做。Sunday/TheFork 的战场，CarteAI 定位在推荐层
- **自建 POS** — 不做。Phase 2+ 可能做 POS 集成（读数据），但不自建
- **基于照片的菜品识别** — 不做。场景是看菜单选菜，不是拍菜识别
- **用户注册/账号系统** — 不做。顾客零摩擦，老板端 Phase 1 用简单鉴权
- **吃之前的好评引导** — 用户明确反对。应在用餐后自然引导，且要低调
- **完整 BI 看板** — Phase 1 不做。基础埋点 + 每周面谈足够 POC 验证

## LLM Cost Model (Key Numbers)

- GPT-4.1-nano: $0.10/1M input + $0.40/1M output
- 单次扫码推荐：~800 token in + ~300 token out = **$0.00020/次**
- 小店 300 扫/月: $0.07 → 毛利 99.6% at €19
- 中店 1500 扫/月: $0.36 → 毛利 98% at €19
- 大店 9000 扫/月: $2.17 → 毛利 88.6% at €19

## Open Questions

- **持久化方案选择**: Cloudflare KV vs Vercel Postgres vs Supabase
- **多租户路由设计**: `/r/[slug]` 的 slug 分配机制、冲突处理
- **WhatsApp Business API 审批流程**: 法国区审批要求和时间线
- **EU 过敏原标注法律细节**: 数字菜单是否有额外展示要求
- **海报设计 A/B 测试方案**: 什么话术最能提高扫码率
- **同文化模式切换阈值**: 浏览器语言 ≠ 母语的边界情况处理
- **POC 成功后定价验证**: €19 是否是正确的价格锚点
