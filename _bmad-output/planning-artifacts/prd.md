---
stepsCompleted:
  - "step-01-init"
  - "step-02-discovery"
  - "step-02b-vision"
  - "step-02c-executive-summary"
  - "step-03-success"
  - "step-04-journeys"
  - "step-05-domain"
  - "step-06-innovation"
  - "step-07-project-type"
  - "step-08-scoping"
  - "step-09-functional"
  - "step-10-nonfunctional"
  - "step-11-polish"
  - "step-12-complete"
releaseMode: phased
classification:
  projectType: "b2b2c_saas"
  domain: "restaurant_customer_engagement"
  complexity: "medium"
  projectContext: "brownfield"
  notes: "Phase 1 = managed service (白手套), Phase 2 = self-serve SaaS; 过敏原合规通过免责 disclaimer 降级, disclaimer 永远可见写入 NFR"
inputDocuments:
  - "planning-artifacts/product-brief-carte-ai.md"
  - "planning-artifacts/product-brief-carte-ai-distillate.md"
  - "docs/index.md"
  - "docs/project-overview.md"
  - "docs/architecture.md"
  - "docs/api-contracts.md"
  - "docs/data-models.md"
  - "docs/component-inventory.md"
  - "docs/source-tree-analysis.md"
  - "docs/development-guide.md"
documentCounts:
  briefs: 2
  research: 0
  brainstorming: 0
  projectDocs: 8
workflowType: 'prd'
projectType: 'brownfield'
---

# Product Requirements Document - CarteAI

**Author:** Boyuan
**Date:** 2026-05-04

## Executive Summary

CarteAI 是面向欧洲餐馆的 AI 点餐顾问 SaaS（B2B2C）。顾客扫桌上 QR 码，通过预设按钮选择推荐模式（"第一次来""≤10€""招牌菜""健康""分享"），3 秒内获得 3~4 道个性化菜品推荐——含本地化理由、价格、过敏原警告和信心评分，覆盖 19 种语言，无需注册。

餐馆老板是付费方。核心付费理由：`marginPriority` 隐性推高利润菜 → 每桌预期增收 €2-5；14 种 EU 过敏原内置标注满足 EU 1169/2011 合规义务；19 语言覆盖消除外国顾客的菜单焦虑，提升翻台体验。

产品从 managed service（创始人白手套录入 + POC 免费）起步，验证后演进为 self-serve SaaS（自助注册 + Stripe 订阅）。Phase 1.5 引入 WhatsApp Agent 实现对话式菜单管理——法国独立餐馆老板最自然的工作界面。

### What Makes This Special

**文化感知模式切换**：当顾客浏览器语言与餐馆菜系语言匹配时（如中国人进中餐馆），自动从"翻译+入门推荐"切换为"组菜顾问"模式——根据人数、口味偏好推荐热菜凉菜搭配，而非翻译菜名。同一个产品，两种体验。西欧市场零直接竞品。

**核心洞察**：餐桌 QR 码是离顾客点餐决策最近的触点。Sunday 占了支付层，Zenchef 占了运营层，但推荐层——决定"点什么"的那一层——是空白。LLM 成本暴跌（GPT-4.1-nano 每次推荐 $0.0002）让 AI 推荐在低客单价餐饮场景首次可行；后疫情 QR 码普及消除了用户教育成本。

**双层推荐引擎**：本地规则（必跑/免费/永不失败）+ LLM 增强（可选/可降级），6 条安全护栏锁死 LLM 行为——不发明菜品、不编造价格、过敏数据缺失时强制提醒找服务员。任何 LLM 故障静默降级到本地规则，顾客体验不中断。

## Project Classification

| 维度 | 值 | 备注 |
|------|---|------|
| 项目类型 | B2B2C SaaS | 老板付费，顾客使用；Phase 1 = managed service |
| 领域 | Restaurant Customer Engagement | 餐桌级 AI 推荐 + 餐馆增收 |
| 复杂度 | Medium | 过敏原合规通过免责 disclaimer 模式降级；LLM 护栏 + 19 语言测试矩阵仍有技术挑战 |
| 项目上下文 | Brownfield | 已有 ~3000 行 TS 代码基线（Next.js 16 + React 19 + 双层推荐引擎 + 5 个 API） |

## Success Criteria

### User Success

**顾客（C 端）：**
- 扫码 → 看到推荐：≤10 秒全程（含语言检测 + 模式选择 + 推荐返回）
- 推荐结果含母语理由 + 价格 + 过敏原标注——用户无需二次查找
- 文化匹配模式自动触发时，用户感知"这个懂我"而非"这是翻译器"
- Aha Moment：第一次来的外国顾客扫码后说"比问服务员还快还准"

**老板（B 端）：**
- 菜单录入 < 15 分钟（白手套模式下创始人帮忙）/ < 5 分钟（Phase 1.5 WhatsApp 更新）
- 看到第一周数据（扫码量 + 语言分布 + 推荐查看数）后认为"这东西有用"
- 不需要学习新后台系统即可维护菜单

### Business Success

| 阶段 | 指标 | 目标 | 时间线 |
|------|------|------|--------|
| POC | QR 扫码量 | 建立基线（绝对数字） | 部署后持续 |
| POC | 推荐页停留时长 | ≥30 秒 | 部署后持续 |
| POC | 推荐采纳率 | ≥20%（餐后弹窗） | 部署后持续 |
| POC | 老板满意度 | 正面（每周面谈） | 部署后持续 |
| Phase 1 | 付费餐馆数 | 10 家（巴黎） | POC 验证后 |
| Phase 1 | MRR | €190-400 | POC 验证后 |
| Phase 1 | 老板月留存率 | ≥80% | POC 验证后 |

### Technical Success

- 推荐 API P95 延迟 ≤3 秒（含 LLM 调用）
- LLM 降级透明：LLM 故障时顾客无感知，自动切换本地规则
- 过敏原免责 disclaimer 100% 出现率——任何推荐结果必须附带"过敏请向服务员确认"
- 单次推荐 LLM 成本 ≤$0.001
- 零数据泄露：不采集 PII，仅匿名行为数据

### Measurable Outcomes

- **核心验证假设**：顾客在复杂/外语菜单场景下，AI 推荐的采纳率 ≥20%
- **付费验证假设**：至少 1 家 POC 餐馆愿意在免费期结束后以 €19/月 续费
- **增长验证假设**：已入驻餐馆门口 "AI Menu" 标识带来至少 1 家自然询盘/月

## Product Scope

> 详细范围、Must-Have 能力表和阶段路线图见下方 [Project Scoping & Phased Development](#project-scoping--phased-development) 章节。

- **Phase 1（MVP，1 周）**：多租户路由 + 持久化 + 鉴权 + 速率限制 + 文化感知模式切换 + 完整 Dashboard + AI 菜品图片生成 + 核心 E2E 测试
- **Phase 1.5**：WhatsApp Agent + Pro 定价 + 自动报告
- **Phase 2**：自助注册 + Stripe + 多店管理 + 从推荐延伸到点单/支付/会员

## User Journeys

### Journey 1: Marco — 美国游客在巴黎中餐馆（核心 happy path）

**Opening Scene：** Marco 是来巴黎出差的纽约产品经理，同事带他去 13 区一家地道中餐馆。80 道菜的菜单全是法语和中文，他一个字不认识。服务员在忙，他不好意思一直问。

**Rising Action：** 他注意到桌上的 QR 码海报写着 "AI Menu · 19 Languages"。扫码后浏览器自动识别英语，页面出现 5 个按钮。他点了 "First Time Here"，勾了 "No Shellfish"（他对甲壳类过敏）。

**Climax：** 3 秒后出现 3 道推荐——英文菜名 + 中文原名 + 一句理由（"Most popular among first-time visitors, mild and aromatic"）+ 价格 €12.50 + 过敏原标注绿色✓ + 底部提醒 "Please confirm allergens with staff"。他点了第一道，服务员看了一眼就明白了。

**Resolution：** 吃完后页面温和弹出"Did you order our recommendation?"，他点了 Yes。他把 CarteAI 推荐给了同事。饭后在 Google Maps 留了好评。

### Journey 2: 小张一家 — 中国人在中餐馆聚餐（文化匹配模式）

**Opening Scene：** 小张和 4 个朋友在巴黎一家川菜馆聚餐。他们都是中国人，不需要翻译，但选菜搭配是个问题——谁负责点菜总是纠结半天。

**Rising Action：** 小张扫码，浏览器语言 zh + 餐馆菜系 Chinese → 自动切换"组菜顾问"模式。页面问"几位用餐？"选 5 人。问"有什么忌口？"勾了"不吃香菜""微辣"。

**Climax：** AI 推荐了一套搭配：2 道热菜 + 1 道凉菜 + 1 道汤 + 1 道主食，每道都有理由（"5人聚餐经典搭配，荤素均衡"）。总价 €68，人均 €13.6。小张说"就这么点"，省了 10 分钟纠结。

**Resolution：** 餐后弹窗"您点了推荐菜吗？"——是。小张发了条朋友圈："这个 AI 点菜也太懂了吧"。

**Edge Case A：** 小张的朋友小李第一次来这家川菜馆，虽然也是中国人，但想看看这家有什么特色菜。页面底部有一个低调的模式切换按钮，点击后切换到入门推荐模式——不翻译，但侧重"这家的招牌菜/人气菜"推荐。

**Edge Case B：** 一位法中双语用户去了一家她常去的中餐馆。系统检测到法语浏览器 → 默认进入翻译+入门模式。但她很熟悉这家菜，想要组菜搭配建议。她点击模式切换按钮，切换到组菜顾问模式。模式切换按钮低调但可双向操作。

### Journey 3: Mme Dupont — 餐馆老板 onboarding（B 端白手套）

**Opening Scene：** Dupont 太太在蒙马特经营一家 45 座的法式小酒馆，30 年了。菜单 40 道菜，纸质，只有法语。她听隔壁的中餐馆老板说装了个"AI 菜单很好用"，通过 `contact@carte-ai.link` 联系了 CarteAI。

**Rising Action：** CarteAI bot 引导她拍照上传纸质菜单。上传到 `/api/ingest` → AI 5 分钟内提取出结构化菜单草稿（法语菜名 + 自动翻译英文/中文 + 推测过敏原）。Bot 引导她逐条审核，她确认了 38 道菜，修正了 2 道过敏原标注。

**Climax：** Bot 自动发布菜单并生成海报 PDF。Dupont 太太打印后贴在门口和每张桌上。她用自己手机扫码——看到自己的菜单用英文、中文、日文展示，推荐理由写着"Madame Dupont's signature duck confit, served since 1996"。她笑了。

**Resolution：** 一周后 bot 自动推送周报：这周 87 次扫码，62% 是英语用户，推荐页平均停留 45 秒。她说"这东西真的有用，特别是旅游季"。菜单有变时，她给 bot 发消息"今天鸭腿卖完了"，bot 自动更新。创始人只在异常时介入。

### Journey 4: Marco 过敏原边缘场景（错误恢复）

**Opening Scene：** 同一个 Marco，这次去了一家印度餐馆。菜单上过敏原标注不完整——老板录入时有几道菜没填过敏原。

**Rising Action：** Marco 扫码，选 "First Time Here"，勾了 "No Peanuts"。AI 返回 3 道推荐，其中第 2 道的过敏原字段标注为 `unknown`。

**Climax：** 推荐卡上这道菜显示橙色⚠️标签："Allergen data incomplete — please check with staff"。底部 disclaimer 照常出现："Always confirm allergens with your server"。Marco 跟服务员确认后发现这道菜确实含花生，没点。

**Resolution：** 系统成功拦截了潜在过敏风险。这次查询被存档为合规审计证据。Marco 虽然少了一个选择但信任度反而更高——"至少它不会乱猜"。

### Journey 5: 创始人运维 — 异常介入

**Opening Scene：** 系统日常运行完全自动化——老板跟 bot 交互完成菜单管理和数据查看。创始人通过监控面板关注整体健康度。

**Rising Action：** 监控告警：某家餐馆连续 3 天扫码量从日均 30 降到 5。bot 无法诊断原因（可能是海报被撤、QR 码损坏、或餐馆暂停营业）。系统自动标记为需人工介入。

**Climax：** 创始人联系老板确认情况——原来是海报被雨淋坏了。创始人远程重新生成海报 PDF 发给老板，老板重新打印。

**Resolution：** 扫码量次日恢复。创始人将"海报损坏"加入 bot 的自动诊断问答库，下次 bot 可以自行处理。日常运营中创始人不需要逐个管理餐馆，只处理 bot 解决不了的异常。

### Journey Requirements Summary

| 旅程 | 揭示的核心能力需求 |
|------|-------------------|
| Journey 1 (外国顾客) | 多租户路由 `/r/[slug]`、浏览器语言检测、模式选择 UI、推荐 API、过敏原展示、餐后采纳弹窗 |
| Journey 2 (文化匹配) | 文化感知模式切换逻辑、组菜算法（人数→菜品搭配）、中文 UI、低调的"第一次来这家？"模式切换按钮 |
| Journey 3 (老板 onboarding) | Bot 引导式菜单上传、菜单 OCR 提取、审核编辑流程、持久化发布、海报生成、自动周报推送 |
| Journey 4 (过敏原边缘) | 过敏原不完整时的降级展示（⚠️标签）、disclaimer 永远可见、查询存档 |
| Journey 5 (创始人运维) | 监控告警面板、异常自动标记、bot 无法处理时升级到人工、bot 问答库可扩展 |

## Domain-Specific Requirements

### Compliance & Regulatory

- **EU 1169/2011 过敏原标注**：数字菜单必须满足与纸质菜单相同的 14 种过敏原展示义务。CarteAI 策略：标注"可能含有" + 免责 disclaimer "请向服务员确认"——与纸质菜单行业惯例一致。**disclaimer 永远可见**是硬性 NFR。
- **GDPR 匿名数据**：仅采集匿名行为数据（扫码/语言/推荐点击/停留时长），不收集个人身份信息。不设用户账号（C 端）。无需 cookie consent banner（纯匿名数据无需同意）。
- **过敏原查询存档**：每次含过敏原过滤的推荐请求自动存档（tenant_id + timestamp + allergens_filtered + response），可作为合规审计证据。

### Technical Constraints

- **LLM 安全护栏不可妥协**：6 条硬约束（不发明菜品/价格/过敏原/卡路里，过敏缺失强制提醒，仅输出 valid JSON）必须在所有 LLM 路径（OpenAI/Gemini）和降级路径（本地规则）中一致执行。
- **降级透明性**：LLM 故障时自动切换本地规则，顾客端无任何感知差异。不展示"AI 不可用"提示。
- **成本封顶**：按餐馆绑定 LLM 费用上限。Starter 超 5000 扫/月自动降级纯本地规则；Pro 有软上限 + 通知老板。

### Integration Requirements

- **WhatsApp Business API**（Phase 1.5）：老板日常菜单管理的主要交互渠道。需提前调研法国区审批要求。
- **Google Places API v1**：餐馆 identity 来源（名称/地址/评分/照片）。仅读取公开元数据，不爬取 Google Maps 页面。
- **Cloudflare Email Routing**：`contact@carte-ai.link` 咨询入口。

### Risk Mitigations

| 风险 | 缓解 |
|------|------|
| LLM 推荐出幻觉菜品 | 6 条护栏 + LLM 只能从本地规则筛出的 candidates 子集中选择 |
| 过敏原标注错误导致健康事故 | "可能含有" + 永远可见的 disclaimer + 查询存档 |
| 老板填错过敏原数据 | 未知过敏原自动标为 `unknown` + 橙色⚠️提醒顾客确认 |
| LLM 成本失控 | 按餐馆封顶 + nano 模型 + 本地规则兜底 |
| 文化匹配模式误判（用户实际需求与自动检测不符） | 提供低调的双向模式切换按钮，入门⇄组菜可自由切换，覆盖双语用户、第一次来等场景 |

## Innovation & Novel Patterns

### Detected Innovation Areas

1. **文化感知模式切换**：不是简单的语言翻译，而是根据顾客-餐馆文化关系动态切换整套推荐策略（翻译+入门 vs 组菜顾问）。这是推荐系统领域的新模式——现有竞品均为单一模式。
2. **双层 AI 安全架构**：本地规则（必跑/确定性/免费）+ LLM 增强（可选/概率性/付费），LLM 被限制在本地规则筛出的 candidate 子集内。不是简单的 fallback，而是"AI 只能在安全围栏内发挥创意"的架构模式。
3. **WhatsApp-native 餐馆 SaaS**（Phase 1.5）：用老板已有的 WhatsApp 工作习惯替代传统后台 dashboard——"给 bot 发消息"而非"登录系统操作"。在法国独立餐馆场景下是 AI Agent 的实际落地。

### Market Context & Competitive Landscape

- 西欧餐桌级 AI 推荐赛道无直接竞品。Sunday（支付层）、Zenchef（运营层）、Menutech（合规层）均未进入推荐层
- 美国 Menu-Order-AI 做 AI 推荐但仅英语/无文化感知
- LLM 成本曲线在 2025-2026 暴跌（GPT-4.1-nano $0.0002/次），使得餐饮低客单价场景首次可承受 AI 推荐的边际成本
- 后疫情 QR 码在欧洲餐馆已常态化，无需用户教育

### Validation Approach

| 创新点 | 验证方式 | 成功标准 |
|--------|---------|---------|
| 文化感知模式切换 | POC 中餐馆同时观察中文用户和外语用户的行为差异 | 两种模式的推荐采纳率均 ≥20% |
| 双层 AI 架构 | 对比 LLM 增强 vs 纯本地规则的推荐采纳率 | LLM 增强推荐采纳率高于本地规则 ≥10pp |
| "第一次来这家？"模式切换 | 追踪文化匹配模式下该按钮的点击率 | 按钮被发现且使用（点击率 >5%） |

### Risk Mitigation

| 创新风险 | Fallback |
|---------|----------|
| 文化匹配检测不准（浏览器语言 ≠ 母语） | "第一次来这家？"按钮允许手动切换；默认策略不侵入 |
| LLM 增强无明显体验提升 | 纯本地规则已可用且免费，LLM 增强变为可选增值 |
| WhatsApp Agent 审批延迟 | Phase 1 不依赖，老板通过 admin 后台或联系 bot 管理菜单 |

## B2B2C SaaS Specific Requirements

### Project-Type Overview

CarteAI 是 B2B2C SaaS：老板（B）付费购买服务，顾客（C）通过 QR 码使用推荐功能。Phase 1 以 managed service 模式运营（创始人/bot 协助 onboarding），Phase 2 演进为 self-serve SaaS。C 端完全匿名无账号，B 端需鉴权保护。

### Tenant Model

- **租户单位**：一家餐馆 = 一个 tenant
- **路由模式**：`/r/[slug]`（顾客端）+ `/admin/[slug]`（老板端）
- **slug 分配**：基于餐馆名自动生成 kebab-case slug，冲突时追加城市或数字后缀
- **数据隔离**：行级隔离（所有表含 `tenant_id`），无跨租户数据访问
- **当前状态**：单租户 demo，需升级。`RestaurantMenu.restaurant.slug` 字段已预留

### Permission Model

| 角色 | 权限 | 鉴权方式 |
|------|------|---------|
| 顾客 | 只读：`/r/[slug]` 推荐页 + `/api/recommend` | 无需鉴权，完全匿名 |
| 老板 | 读写：自己餐馆的菜单/数据/设置 | Phase 1: 简单令牌（邀请链接 + session token）；Phase 2: Auth.js / Clerk |
| Bot | 读写：代老板管理菜单 | API key per tenant |
| 创始人/Admin | 全局读写：所有餐馆 + 监控面板 | 超级管理员账号 |

### Subscription Tiers

| 档位 | 月费 | 包含 | LLM 封顶 |
|------|------|------|---------|
| **POC/Free** | €0 | 全功能（限时） | 5000 扫/月 |
| **Starter** | €19/月 | QR 推荐 + 菜单管理 + 海报 + 基础埋点 + 过敏原合规 | 5000 扫/月，超出降级本地规则 |
| **Pro** | €39/月 | + WhatsApp Agent + 日报/周报 + 优先支持 | 软上限 + 通知 |
| **Enterprise** | 定制 | + API/POS 集成 + 多店 + 专属支持 | 按量 |

Phase 1 不实现 Stripe 计费——POC 免费，商业化后首月免费，手动收款。Phase 2 接入 Stripe 订阅。

### Integration List

| 集成 | Phase | 方向 | 用途 |
|------|-------|------|------|
| Google Places API v1 | 1 | 出站 | 餐馆 identity 来源 |
| OpenAI API | 1 | 出站 | LLM 文本推荐 + 结构化 |
| Google Gemini API | 1 | 出站 | Vision OCR（菜单图片/PDF） |
| Vercel Blob | 1 | 出站 | AI 生成菜品图片存储（canonical tag 索引） |
| AI 图片生成 API | 1 | 出站 | 菜品参考图片生成（DALL·E / Flux 等） |
| Cloudflare Email Routing | 1 | 入站 | `contact@carte-ai.link` 咨询 |
| WhatsApp Business API | 1.5 | 双向 | 老板菜单管理 bot |
| Stripe | 2 | 出站 | 订阅计费 |

### Technical Architecture Considerations

- **持久化**：从 localStorage + 静态 JSON 升级到服务端数据库。候选：Vercel Postgres (Neon) / Supabase——架构阶段决定
- **核心表**：`tenants`、`menus`（jsonb payload + version）、`recommendations_log`、`analytics_events`
- **缓存**：菜单数据变更频率低，可在边缘缓存（Vercel Edge / KV），TTL 按 tenant 配置
- **API 鉴权 middleware**：Next.js middleware 拦截 `/admin/*` 和 `/api/ingest`，顾客端 `/r/*` 和 `/api/recommend` 无需鉴权
- **速率限制**：Upstash Ratelimit，按 tenant + IP，特别保护 `/api/recommend`（LLM 成本）和 `/api/ingest`（文件上传）

### Implementation Considerations

- **Brownfield 迁移策略**：现有 `data/menu.json` + `localStorage` 代码需平滑迁移到数据库读写，保留本地开发的 fallback 模式
- **多租户改造影响面**：路由（`/r/[slug]`）+ 数据模型（所有表加 `tenant_id`）+ API（按 slug 读取菜单）+ 组件（Admin 按 tenant 鉴权）
- **1 周交付约束**：优先实现最小可用路径——持久化 + 多租户路由 + 基础鉴权 + 速率限制 + 完整 dashboard。文化感知模式切换已有代码基线可复用

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach：** Problem-solving MVP —— 证明"AI 推荐在复杂/外语菜单场景下有人用、有人信"。

**核心验证假设：**
1. 顾客会扫码并使用 AI 推荐（扫码率 + 停留时长）
2. 推荐结果有用（采纳率 ≥20%）
3. 老板认为有价值（愿意续费 €19/月）

**资源：** 1 人（创始人）+ AI 辅助开发，1 周内完成 MVP 开发。

### MVP Feature Set (Phase 1)

**Core User Journeys Supported：**
- Journey 1（外国顾客 happy path）✅
- Journey 2（文化匹配模式 + "第一次来这家？"切换）✅
- Journey 3（老板 onboarding via bot）✅
- Journey 4（过敏原边缘场景）✅
- Journey 5（创始人运维）✅ 完整 dashboard

**Must-Have Capabilities：**

| 能力 | 现有 | 需新建/改造 |
|------|------|-----------|
| `/r/[slug]` 多租户顾客页 | ❌ | 新建路由 + 按 slug 加载菜单 |
| 服务端菜单持久化 | ❌ | 数据库 + CRUD API |
| 基础老板鉴权 | ❌ | 邀请链接 + session token + middleware |
| 速率限制 | ❌ | Upstash Ratelimit |
| LLM 成本封顶（per tenant） | ❌ | 扫码计数 + 超限降级逻辑 |
| 文化感知模式切换 | 部分 | 浏览器语言 vs 餐馆菜系匹配逻辑 |
| "第一次来这家？"切换按钮 | ❌ | 组菜模式 UI 底部低调链接 |
| `marginPriority` 老板可配置 | 类型已定义，UI 未暴露 | Admin 编辑器中暴露开关 |
| QR 海报生成 | ✅ 已有 | 适配多租户 slug |
| **完整精细化 Admin Dashboard** | ❌ | 全局+单餐馆下钻，近实时数据 |
| 精细化数据埋点 | ❌ | analytics_events 表 + 全链路事件采集 |
| 餐后采纳弹窗 | ❌ | 推荐页定时触发 |
| 餐后好评引导 | ❌ | 推荐页底部小提示（非侵入） |
| 过敏原 disclaimer 永远可见 | ✅ safetyNotice 已有 | 确保所有路径一致 |
| 过敏原查询存档 | ❌ | recommendations_log 表 |
| `contact@carte-ai.link` | 待配置 | Cloudflare Email Routing |
| E2E 测试 | ❌（Playwright 已装） | 核心链路测试 |

**Admin Dashboard 详细指标：**

| 指标类别 | 具体指标 | 粒度 |
|---------|---------|------|
| 扫码 | 扫码量（按时段/天/周）、趋势图 | 全局 + 单餐馆 |
| 推荐 | 推荐查看次数、推荐模式分布（first_time/cheap/healthy/signature/sharing） | 全局 + 单餐馆 |
| 采纳 | 推荐采纳率（弹窗反馈 Yes/No）、采纳趋势 | 全局 + 单餐馆 |
| 用户行为 | 停留时长分布、语言分布、过敏原过滤频次 | 全局 + 单餐馆 |
| 文化感知 | 文化匹配模式触发率、"第一次来这家？"按钮点击率 | 全局 + 单餐馆 |
| LLM | 每餐馆调用量、成本累计、降级次数、provider 分布 | 单餐馆 + 汇总 |
| 业务 | 日活/周活餐馆数、每餐馆日均扫码 | 全局 |
| 实时性 | 近实时更新（分钟级） | 全部 |

### Post-MVP Features

**Phase 1.5（MVP 部署后迭代）：**
- WhatsApp Agent（Hermes + WhatsApp Business API）— 对话式菜单 CRUD
- Pro 阶梯定价（€39/月）
- 自动日报/周报推送到老板
- Bot 自动诊断问答库扩展

**Phase 2（开放 SaaS）：**
- 自助注册 + onboarding 向导
- Stripe 订阅计费
- 多店管理（一个老板多家餐馆）
- Auth.js / Clerk 替代简单令牌
- 从推荐延伸到点单 → 支付 → 会员
- 完整 BI 自助报表（Phase 1 的 Dashboard 覆盖创始人运营需求，Phase 2 开放老板自助分析）

### Risk Mitigation Strategy

**Technical Risks：**
- 最大技术挑战：1 周内完成 localStorage → 数据库 + 多租户 + 完整 dashboard。缓解：dashboard 用 Server Components 直接查询数据库 + 简洁 Tailwind UI，不引入重型 BI 框架
- 文化感知模式切换的组合测试：缓解：POC 期间仅中餐馆场景，限制测试矩阵

**Market Risks：**
- QR 扫码率可能低（海报不吸引人）：缓解：POC 快速迭代海报设计，A/B 测试话术
- 老板觉得"没用"：缓解：POC 免费 + dashboard 数据说话

**Resource Risks：**
- 1 人 + AI 开发，无冗余。缓解：严格砍非 MVP 功能，Phase 1 不做 Stripe/自助注册
- 如果 1 周不够：降级方案——先部署核心功能（多租户 + 推荐），dashboard 第 2 周补齐

## Functional Requirements

### 多租户餐馆管理

- FR1: 系统可按 slug 路由到不同餐馆的专属推荐页（`/r/[slug]`）
- FR2: Admin 可创建新餐馆租户并自动生成唯一 slug
- FR3: 系统在 slug 冲突时自动追加城市或数字后缀
- FR4: 每个餐馆的数据（菜单/埋点/推荐日志）行级隔离，无跨租户访问

### 菜单录入与管理

- FR5: Admin/Bot 可通过拍照/PDF 上传菜单文件，系统自动提取结构化菜单草稿
- FR6: Admin/Bot 可审核并编辑 AI 提取的菜单草稿（菜名/价格/过敏原/分类/标签）
- FR7: Admin/Bot 可发布菜单到服务端持久化存储
- FR8: Admin/Bot 可随时更新单道菜的可用状态（available: true/false）
- FR9: Admin 可配置每道菜的 `marginPriority` 值（1/2/3）
- FR10: 系统通过 Google Places API 搜索餐馆并自动填充 identity 信息（名称/地址/评分）
- FR11: 菜单持久化存储版本化，保留历史版本

### AI 推荐引擎

- FR12: 顾客可选择推荐模式（第一次来/≤10€/招牌菜/健康/分享/不确定）
- FR13: 顾客可设置饮食限制（过敏原排除/饮食标签排除/辣度上限/预算）
- FR14: 系统在 3 秒内返回 3~4 道个性化推荐，含本地化理由、价格、过敏原标注、信心评分
- FR15: 系统自动检测浏览器语言并以对应语言展示推荐结果（19 种语言）
- FR16: 当顾客语言与餐馆菜系语言匹配时，系统自动切换为"组菜顾问"模式
- FR17: 组菜模式下顾客可输入用餐人数和口味偏好，获得热菜/凉菜/主食搭配推荐
- FR18: 系统提供低调的模式切换按钮，允许顾客在"入门推荐"和"组菜顾问"模式间双向切换（如：组菜模式下第一次来可切到入门；入门模式下熟悉该菜系的双语用户可切到组菜）
- FR19: 顾客可通过文字或语音输入自由描述需求
- FR20: 系统始终先运行本地规则引擎，LLM 仅在候选子集内增强排序和理由
- FR21: LLM 故障时系统自动降级到本地规则结果，顾客端无感知

### AI 菜品图片生成

- FR22: 系统在菜品无图片时自动使用 AI 生成最符合该菜品的参考图片
- FR23: AI 生成图片时使用菜品名 + 描述 + 菜系 + 食材作为 prompt context，确保图片与实际菜品高度匹配
- FR24: AI 生成的图片标记"AI Generated · For Reference"标识
- FR25: 系统为每道菜生成标准化 canonical tag（如 `yuxiang-shredded-pork`），相同菜品跨餐馆复用同一张图片
- FR26: AI 判断不同餐馆的菜品是否为同一道菜（如"鱼香肉丝" = "Yu Xiang Shredded Pork"）以决定是否复用
- FR27: AI 生成的菜品图片存储在 Vercel Blob，通过 canonical tag 索引全局图片库
- FR28: 老板审核菜单时可标记"图片不准确"，触发该菜品图片重新生成

### 过敏原合规与安全

- FR29: 系统在每次推荐结果中强制展示过敏原免责 disclaimer（"请向服务员确认"）
- FR30: 过敏原数据缺失的菜品显示橙色⚠️警告标签
- FR31: LLM 严格执行 6 条安全护栏（不发明菜品/价格/过敏原/卡路里，缺失时强制提醒，仅输出 valid JSON）
- FR32: 系统自动存档每次含过敏原过滤的推荐请求（tenant_id + timestamp + allergens + response），可供合规审计

### 数据采集与埋点

- FR33: 系统采集扫码事件（tenant_id + timestamp + 语言 + referrer）
- FR34: 系统采集推荐查看事件（模式/限制条件/结果数/provider/延迟）
- FR35: 系统采集停留时长事件（页面进入→离开的秒数）
- FR36: 系统在顾客停留一段时间后弹出采纳追踪弹窗（"您点了推荐菜吗？是/否"）
- FR37: 系统采集文化感知模式触发事件和模式切换按钮点击事件
- FR38: 系统采集 LLM 调用事件（provider/模型/token 数/成本/是否降级）
- FR39: 所有埋点数据仅为匿名行为数据，不采集个人身份信息

### Admin Dashboard（数据监控）

- FR40: Admin 可查看全局汇总视图（所有餐馆的核心指标概览）
- FR41: Admin 可下钻到单餐馆详细数据视图
- FR42: Dashboard 展示扫码量趋势图（按时段/天/周，支持时间范围选择）
- FR43: Dashboard 展示推荐模式分布（first_time/cheap/healthy/signature/sharing 占比）
- FR44: Dashboard 展示推荐采纳率趋势（弹窗 Yes/No 反馈）
- FR45: Dashboard 展示顾客语言分布和停留时长分布
- FR46: Dashboard 展示文化匹配模式触发率和模式切换按钮点击率
- FR47: Dashboard 展示 LLM 监控面板（每餐馆调用量/成本累计/降级次数/provider 分布）
- FR48: Dashboard 展示业务健康指标（日活/周活餐馆数/每餐馆日均扫码）
- FR49: Dashboard 数据近实时更新（分钟级）

### 鉴权与速率限制

- FR50: 老板端（`/admin/[slug]`）和管理 API 需鉴权保护（邀请链接 + session token）
- FR51: 顾客端（`/r/[slug]`）和推荐 API 无需鉴权
- FR52: 系统对推荐 API 和上传 API 实施速率限制（按 tenant + IP）
- FR53: 系统按餐馆追踪 LLM 调用量，超出封顶线时自动降级到纯本地规则
- FR58: Admin 可查看和配置每家餐馆的 LLM 月度使用额度上限（默认按订阅档位，支持手动覆盖）
- FR59: 系统在餐馆 LLM 使用量达到额度 80% 时通知老板（Pro 档位）或自动降级（Starter 档位）
- FR60: LLM 使用额度按自然月重置，Dashboard 展示当月已用/剩余额度进度条

### 海报与好评引导

- FR54: 系统为每家餐馆生成可打印 QR 海报（含真实二维码指向 `/r/[slug]`）
- FR55: 海报包含 "AI Menu · 19 Languages" 标识
- FR56: 推荐页底部展示非侵入式好评引导提示（餐后可见，低调不突兀）

### 咨询入口

- FR57: 系统提供 `contact@carte-ai.link` 邮件咨询入口（Cloudflare Email Routing）

## Non-Functional Requirements

### Performance

- NFR1: 推荐 API（`/api/recommend`）P95 响应时间 ≤3 秒（含 LLM 调用）
- NFR2: 推荐 API 纯本地规则路径 P95 响应时间 ≤500ms
- NFR3: 菜单加载（`/r/[slug]` 首屏）≤2 秒（含菜单数据获取）
- NFR4: AI 菜品图片生成为异步操作，不阻塞菜单发布流程；图片生成完成前展示占位图
- NFR5: Dashboard 页面加载 ≤3 秒，数据刷新 ≤5 秒
- NFR6: 单个 AI 生成图片请求 ≤30 秒（后台异步，不影响用户体验）

### Security

- NFR7: 老板端所有页面和管理 API 通过 session token 鉴权，未认证请求返回 401
- NFR8: 顾客端不采集任何个人身份信息（PII），符合 GDPR 匿名数据处理原则
- NFR9: LLM API keys 仅存储在服务端环境变量，永不暴露到客户端
- NFR10: 速率限制：推荐 API ≤60 次/分钟/IP，上传 API ≤10 次/分钟/tenant
- NFR11: 过敏原免责 disclaimer 在任何条件下（LLM 成功/降级/错误）100% 出现

### Scalability

- NFR12: 系统支持 100 家餐馆同时运营（Phase 1 目标 10 家，预留 10x 余量）
- NFR13: 单餐馆支持 300 次/小时并发推荐请求（旅游旺季高峰）
- NFR14: LLM 成本封顶降级不影响系统可用性——超限后自动切换本地规则，无中断
- NFR15: AI 生成图片库随餐馆数增长自动扩展，通过 canonical tag 复用避免存储膨胀

### Accessibility

- NFR16: 19 种语言（含 RTL 语言：阿拉伯语）正确渲染，文字方向自动切换
- NFR17: 推荐页满足 WCAG 2.1 AA 级别（对比度、可读字号、键盘可达）
- NFR18: 过敏原警告和 disclaimer 的视觉优先级不低于推荐内容本身

### Reliability

- NFR19: 系统可用性 ≥99.5%（月度，Vercel 平台 SLA 保证）
- NFR20: 任何外部依赖（LLM/Google Places/图片生成）故障时，核心推荐功能不中断
- NFR21: 菜单数据不可丢失——数据库自动备份，菜单发布保留版本历史
- NFR22: 埋点数据写入失败不影响推荐功能（异步 + 容错）

### Data Quality

- NFR23: AI 生成菜品图片与实际菜品视觉相似度需达到可辨认水平——不允许出现明显菜系/食材错误
- NFR24: canonical tag 匹配准确率需人工可审核——老板可标记"图片不对"触发重新生成和 tag 修正
