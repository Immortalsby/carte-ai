---
stepsCompleted:
  - "step-01-validate-prerequisites"
  - "step-02-design-epics"
  - "step-03-create-stories"
  - "step-04-final-validation"
inputDocuments:
  - "planning-artifacts/prd.md"
  - "planning-artifacts/architecture.md"
  - "planning-artifacts/ux-design-specification.md"
---

# CarteAI - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for CarteAI, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: 系统可按 slug 路由到不同餐馆的专属推荐页（`/r/[slug]`）
FR2: Admin 可创建新餐馆租户并自动生成唯一 slug
FR3: 系统在 slug 冲突时自动追加城市或数字后缀
FR4: 每个餐馆的数据（菜单/埋点/推荐日志）行级隔离，无跨租户访问
FR5: Admin/Bot 可通过拍照/PDF 上传菜单文件，系统自动提取结构化菜单草稿
FR6: Admin/Bot 可审核并编辑 AI 提取的菜单草稿（菜名/价格/过敏原/分类/标签）
FR7: Admin/Bot 可发布菜单到服务端持久化存储
FR8: Admin/Bot 可随时更新单道菜的可用状态（available: true/false）
FR9: Admin 可配置每道菜的 `marginPriority` 值（1/2/3）
FR10: 系统通过 Google Places API 搜索餐馆并自动填充 identity 信息（名称/地址/评分）
FR11: 菜单持久化存储版本化，保留历史版本
FR12: 顾客可选择推荐模式（第一次来/≤10€/招牌菜/健康/分享/不确定）
FR13: 顾客可设置饮食限制（过敏原排除/饮食标签排除/辣度上限/预算）
FR14: 系统在 3 秒内返回 3~4 道个性化推荐，含本地化理由、价格、过敏原标注、信心评分
FR15: 系统自动检测浏览器语言并以对应语言展示推荐结果（19 种语言）
FR16: 当顾客语言与餐馆菜系语言匹配时，系统自动切换为"组菜顾问"模式
FR17: 组菜模式下顾客可输入用餐人数和口味偏好，获得热菜/凉菜/主食搭配推荐
FR18: 系统提供低调的模式切换按钮，允许顾客在"入门推荐"和"组菜顾问"模式间双向切换
FR19: 顾客可通过文字或语音输入自由描述需求
FR20: 系统始终先运行本地规则引擎，LLM 仅在候选子集内增强排序和理由
FR21: LLM 故障时系统自动降级到本地规则结果，顾客端无感知
FR22: 系统在菜品无图片时自动使用 AI 生成最符合该菜品的参考图片
FR23: AI 生成图片时使用菜品名 + 描述 + 菜系 + 食材作为 prompt context，确保图片与实际菜品高度匹配
FR24: AI 生成的图片标记"AI Generated · For Reference"标识
FR25: 系统为每道菜生成标准化 canonical tag（如 `yuxiang-shredded-pork`），相同菜品跨餐馆复用同一张图片
FR26: AI 判断不同餐馆的菜品是否为同一道菜（如"鱼香肉丝" = "Yu Xiang Shredded Pork"）以决定是否复用
FR27: AI 生成的菜品图片存储在 Vercel Blob，通过 canonical tag 索引全局图片库
FR28: 老板审核菜单时可标记"图片不准确"，触发该菜品图片重新生成
FR29: 系统在每次推荐结果中强制展示过敏原免责 disclaimer（"请向服务员确认"）
FR30: 过敏原数据缺失的菜品显示橙色⚠️警告标签
FR31: LLM 严格执行 6 条安全护栏（不发明菜品/价格/过敏原/卡路里，缺失时强制提醒，仅输出 valid JSON）
FR32: 系统自动存档每次含过敏原过滤的推荐请求（tenant_id + timestamp + allergens + response），可供合规审计
FR33: 系统采集扫码事件（tenant_id + timestamp + 语言 + referrer）
FR34: 系统采集推荐查看事件（模式/限制条件/结果数/provider/延迟）
FR35: 系统采集停留时长事件（页面进入→离开的秒数）
FR36: 系统在顾客停留一段时间后弹出采纳追踪弹窗（"您点了推荐菜吗？是/否"）
FR37: 系统采集文化感知模式触发事件和模式切换按钮点击事件
FR38: 系统采集 LLM 调用事件（provider/模型/token 数/成本/是否降级）
FR39: 所有埋点数据仅为匿名行为数据，不采集个人身份信息
FR40: Admin 可查看全局汇总视图（所有餐馆的核心指标概览）
FR41: Admin 可下钻到单餐馆详细数据视图
FR42: Dashboard 展示扫码量趋势图（按时段/天/周，支持时间范围选择）
FR43: Dashboard 展示推荐模式分布（first_time/cheap/healthy/signature/sharing 占比）
FR44: Dashboard 展示推荐采纳率趋势（弹窗 Yes/No 反馈）
FR45: Dashboard 展示顾客语言分布和停留时长分布
FR46: Dashboard 展示文化匹配模式触发率和模式切换按钮点击率
FR47: Dashboard 展示 LLM 监控面板（每餐馆调用量/成本累计/降级次数/provider 分布）
FR48: Dashboard 展示业务健康指标（日活/周活餐馆数/每餐馆日均扫码）
FR49: Dashboard 数据近实时更新（分钟级）
FR50: 老板端（`/admin/[slug]`）和管理 API 需鉴权保护（邀请链接 + session token）
FR51: 顾客端（`/r/[slug]`）和推荐 API 无需鉴权
FR52: 系统对推荐 API 和上传 API 实施速率限制（按 tenant + IP）
FR53: 系统按餐馆追踪 LLM 调用量，超出封顶线时自动降级到纯本地规则
FR54: 系统为每家餐馆生成可打印 QR 海报（含真实二维码指向 `/r/[slug]`）
FR55: 海报包含 "AI Menu · 19 Languages" 标识
FR56: 推荐页底部展示非侵入式好评引导提示（餐后可见，低调不突兀）
FR57: 系统提供 `contact@carte-ai.link` 邮件咨询入口（Cloudflare Email Routing）
FR58: Admin 可查看和配置每家餐馆的 LLM 月度使用额度上限（默认按订阅档位，支持手动覆盖）
FR59: 系统在餐馆 LLM 使用量达到额度 80% 时通知老板（Pro 档位）或自动降级（Starter 档位）
FR60: LLM 使用额度按自然月重置，Dashboard 展示当月已用/剩余额度进度条

### NonFunctional Requirements

NFR1: 推荐 API（`/api/recommend`）P95 响应时间 ≤3 秒（含 LLM 调用）
NFR2: 推荐 API 纯本地规则路径 P95 响应时间 ≤500ms
NFR3: 菜单加载（`/r/[slug]` 首屏）≤2 秒（含菜单数据获取）
NFR4: AI 菜品图片生成为异步操作，不阻塞菜单发布流程；图片生成完成前展示占位图
NFR5: Dashboard 页面加载 ≤3 秒，数据刷新 ≤5 秒
NFR6: 单个 AI 生成图片请求 ≤30 秒（后台异步，不影响用户体验）
NFR7: 老板端所有页面和管理 API 通过 session token 鉴权，未认证请求返回 401
NFR8: 顾客端不采集任何个人身份信息（PII），符合 GDPR 匿名数据处理原则
NFR9: LLM API keys 仅存储在服务端环境变量，永不暴露到客户端
NFR10: 速率限制：推荐 API ≤60 次/分钟/IP，上传 API ≤10 次/分钟/tenant
NFR11: 过敏原免责 disclaimer 在任何条件下（LLM 成功/降级/错误）100% 出现
NFR12: 系统支持 100 家餐馆同时运营（Phase 1 目标 10 家，预留 10x 余量）
NFR13: 单餐馆支持 300 次/小时并发推荐请求（旅游旺季高峰）
NFR14: LLM 成本封顶降级不影响系统可用性——超限后自动切换本地规则，无中断
NFR15: AI 生成图片库随餐馆数增长自动扩展，通过 canonical tag 复用避免存储膨胀
NFR16: 19 种语言（含 RTL 语言：阿拉伯语）正确渲染，文字方向自动切换
NFR17: 推荐页满足 WCAG 2.1 AA 级别（对比度、可读字号、键盘可达）
NFR18: 过敏原警告和 disclaimer 的视觉优先级不低于推荐内容本身
NFR19: 系统可用性 ≥99.5%（月度，Vercel 平台 SLA 保证）
NFR20: 任何外部依赖（LLM/Google Places/图片生成）故障时，核心推荐功能不中断
NFR21: 菜单数据不可丢失——数据库自动备份，菜单发布保留版本历史
NFR22: 埋点数据写入失败不影响推荐功能（异步 + 容错）
NFR23: AI 生成菜品图片与实际菜品视觉相似度需达到可辨认水平——不允许出现明显菜系/食材错误
NFR24: canonical tag 匹配准确率需人工可审核——老板可标记"图片不对"触发重新生成和 tag 修正

### Additional Requirements

- **Brownfield 渐进改造**：在现有 ~3000 行 TS 代码基线上渐进改造，保留所有现有文件路径，不破坏现有引用
- **数据库层**：Vercel Postgres (Neon) + Drizzle ORM，所有表定义在 `src/lib/db/schema.ts` 单文件
- **认证系统**：Better Auth + Google SSO，catch-all route handler `/api/auth/[...all]/route.ts`
- **速率限制**：Upstash Ratelimit + Redis，在 Route Handler 内部检查（不在中间件）
- **菜品图片混合策略**：Pixabay API（主）→ Pexels API（补充）→ AI 生成（兜底），通过 `dish_images` 表和 canonical tag 全局复用
- **Server Components 优先**：读操作优先 SC 直连 DB；写操作用 Route Handler 或 Server Action
- **无全局状态库**：URL + Server Component + useState 足够，不引入 Zustand/Jotai/Redux
- **API 响应格式**：直接返回数据，错误统一 `{ error: string, detail?: unknown }`，不加 wrapper
- **命名规范**：DB 列名 snake_case，代码变量 camelCase，组件 PascalCase，价格整数分 cents
- **测试组织**：Playwright E2E 测试在 `e2e/` 根目录，单元测试 co-located `*.test.ts`
- **CI/CD**：GitHub Actions — lint + build + Playwright E2E + axe-core a11y
- **LLM 额度管理**：`llm_usage` 表按 tenant_id + month 追踪，80% 通知/100% 降级
- **菜单版本化**：menus 表含 version 整数字段，保留历史版本
- **埋点管道**：前端 `navigator.sendBeacon` 异步发送，后端直写 DB，Server Components 聚合查询
- **租户隔离**：所有 DB 查询必须带 `tenant_id` 条件，admin 端验证 session.userId === tenant.owner_id
- **环境变量管理**：`DATABASE_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`
- **Starter Template**：不使用 starter template，在现有 Brownfield 代码库上渐进改造

### UX Design Requirements

UX-DR1: 实现三层动画架构——Rive（AI Concierge 角色状态机）+ Lottie（菜系等待动画）+ Framer Motion（UI 微交互），所有动画尊重 `prefers-reduced-motion` 系统设置
UX-DR2: 实现 11 套菜系动态配色系统（chinese/french/indian/italian/japanese/korean/thai/mexican/mediterranean/vietnamese + 默认），通过 `<html data-cuisine>` 属性 + CSS 变量（`--carte-*`）驱动，所有组件仅引用变量不硬编码颜色
UX-DR3: 实现 RestaurantHeader 组件——首屏信任建立（餐馆名 Display 字号 + 菜系标签 + Google 评分≥4.5 才显示 + 地址），背景使用菜系光晕渐变
UX-DR4: 实现 ModeSelector 组件——5 个预设模式大按钮（🆕第一次来/💰≤10€/⭐招牌菜/🥗健康/🍻分享），2×3 网格布局，单选后展开 AllergenChipGroup，支持 `role="radiogroup"` 键盘导航
UX-DR5: 实现 AllergenChipGroup 组件——零文字输入的饮食限制多选 toggle（不辣/素食/不吃牛/不吃海鲜/无奶/无麸质），chip 配色跟随菜系，`aria-pressed` 状态
UX-DR6: 实现 RecommendationCard 组件——玻璃态毛玻璃卡片（菜品大图 160px + AI Generated badge + 菜名原名+翻译 + 价格 + 推荐理由 + AllergenBadge + ConfidenceScore + disclaimer），边框颜色跟随菜系配色，Framer Motion staggered 弹跳入场（间隔 200ms）
UX-DR7: 实现 AllergenBadge 组件——三态过敏原标签（safe ✅绿色 / unknown ⚠️橙色高亮加粗 / disclaimer ⚠️muted），图标+颜色+文字三重编码色盲友好
UX-DR8: 实现 ConfidenceScore 组件——推荐信心评分百分比显示，颜色编码（≥80%绿色 / 50-80%黄色 / <50%橙色）
UX-DR9: 实现 AIConciergeOrb 组件——Rive 动画发光球体角色（品牌符号），6 种状态（idle 微笑浮动/thinking 眨眼冒泡/excited 光晕扩大/concerned 橙色光晕/listening 脉冲/hidden），固定右下角，点击展开 AI 对话 Sheet
UX-DR10: 实现 CuisineLoader 组件——菜系特色 Lottie 等待动画（中餐筷子旋转/法餐红酒摇晃/通用刀叉等），按 restaurant_type 路由到对应动画，11 种菜系 + 1 通用默认，`prefers-reduced-motion` 时替换为静态文字
UX-DR11: 实现 ComboMealCard 组件——组菜模式专用套餐卡，展示多道菜的分类搭配（热菜/凉菜/汤/主食）+ 总价 + 人均价
UX-DR12: 实现 SharePanel 组件——社交分享面板（shadcn Sheet bottom），自动生成精美推荐卡图片 + 6 个平台按钮（Instagram/Facebook/Snapchat/X/WhatsApp/复制链接）+ 可编辑预填文案，调用 Web Share API
UX-DR13: 实现 PostMealPrompt 组件——餐后时序编排器（停留 >5 分钟触发），依次呈现：采纳弹窗（Dialog）→ 分享入口浮现 → 好评引导小提示，不同时轰炸
UX-DR14: 实现 VoiceInputButton 组件——AI 对话语音输入（长按录音/松手发送），Web Speech API 集成，波形动画 + 红色录音指示
UX-DR15: 实现 DashboardMetricCard 组件——老板数据卡（大数字 + 单位 + 趋势箭头↑↓ + 百分比变化 + 描述标签），三态颜色（positive 绿/negative 红/neutral 灰）
UX-DR16: 实现深色暖调视觉基底（"暖夜食堂"方向）——底色 `#0a0a0f`（带暖调）、暖光光晕背景、玻璃态面板（毛玻璃+微透光+暖色边框），从现有赛博冷调风格迁移
UX-DR17: 实现完整字号层级系统（移动端优先）——Display 28px/H1 24px/H2 20px/H3 16px/Body 15px（行高1.6）/Body Small 13px/Caption 11px/Price 18px tabular-nums
UX-DR18: 实现间距系统（4px 基准 8 级 token）+ 布局原则（移动优先 375px 基准/安全区域/触控目标 ≥44x44px/顾客端最大宽度 480px/管理端 1280px）
UX-DR19: RTL 布局支持——阿拉伯语等 RTL 语言自动 `dir="rtl"` 切换布局方向，包括导航、卡片、文字对齐全部镜像
UX-DR20: WCAG 2.1 AA 无障碍合规——对比度 4.5:1（正文）/3:1（大字）、键盘 Tab 序 + focus ring（shadcn 内置）、过敏原三重编码、语义 HTML（推荐卡 `<article>`、disclaimer `role="alert"`）、屏幕阅读器 aria-label
UX-DR21: 所有降级路径（LLM 故障/图片生成失败/外部 API 不可用）的 UI 静默处理——不展示错误信息，用户零感知
UX-DR22: AI 对话面板——从底部半屏弹出（shadcn Sheet bottom），不全屏覆盖，用户可随时收起回到按钮模式；对话风格为"朋友"语气而非"客服"语气；逐句出现效果（打字效果）
UX-DR23: 推荐卡 staggered 入场动画——Framer Motion 依次弹跳入场（每张间隔 200ms），先图片后文字渐显
UX-DR24: 菜品图片视觉标准——暖光质感、有食欲感、占卡片主视觉面积（100% 宽度 × 160px 高度），AI 生成图片标注"AI Generated · For Reference"
UX-DR25: Admin Dashboard 布局——左侧导航栏（📊概览/📋菜单/🎨海报/⚙️设置）+ 主区域数据卡 + 趋势图 + LLM 额度进度条，桌面 12 列/平板 6 列/手机 1 列响应式栅格

### FR Coverage Map

FR1: Epic 1 - 多租户 slug 路由
FR2: Epic 1 - 创建租户并生成 slug
FR3: Epic 1 - slug 冲突自动处理
FR4: Epic 1 - 行级数据隔离
FR5: Epic 2 - 拍照/PDF 上传菜单
FR6: Epic 2 - 审核编辑菜单草稿
FR7: Epic 2 - 发布菜单到持久化存储
FR8: Epic 2 - 更新菜品可用状态
FR9: Epic 2 - 配置 marginPriority
FR10: Epic 2 - Google Places 自动填充餐馆信息
FR11: Epic 2 - 菜单版本化
FR12: Epic 3 - 推荐模式选择
FR13: Epic 3 - 饮食限制设置
FR14: Epic 3 - 个性化推荐（含信心评分）
FR15: Epic 3 - 浏览器语言检测与多语言展示
FR16: Epic 4 - 文化感知自动模式切换
FR17: Epic 4 - 组菜模式（人数/口味/搭配）
FR18: Epic 4 - 双向模式切换按钮
FR19: Epic 5 - 文字/语音自由描述需求
FR20: Epic 3 - 本地规则引擎先运行
FR21: Epic 3 - LLM 故障自动降级
FR22: Epic 6 - 无图菜品自动 AI 生成图片
FR23: Epic 6 - AI 图片 prompt context
FR24: Epic 6 - AI Generated 标识
FR25: Epic 6 - canonical tag 标准化
FR26: Epic 6 - AI 判断菜品是否相同
FR27: Epic 6 - Vercel Blob 图片存储
FR28: Epic 6 - 老板标记图片不准确触发重生成
FR29: Epic 3 - 过敏原 disclaimer 强制展示
FR30: Epic 3 - 过敏原 unknown 橙色⚠️标签
FR31: Epic 3 - LLM 6 条安全护栏
FR32: Epic 8 - 推荐请求存档（合规审计）
FR33: Epic 8 - 扫码事件采集
FR34: Epic 8 - 推荐查看事件采集
FR35: Epic 8 - 停留时长事件采集
FR36: Epic 7 - 餐后采纳追踪弹窗
FR37: Epic 4 - 文化模式事件采集
FR38: Epic 8 - LLM 调用事件采集
FR39: Epic 8 - 匿名数据原则
FR40: Epic 8 - 全局汇总 Dashboard
FR41: Epic 8 - 单餐馆下钻 Dashboard
FR42: Epic 8 - 扫码量趋势图
FR43: Epic 8 - 推荐模式分布
FR44: Epic 8 - 推荐采纳率趋势
FR45: Epic 8 - 语言分布与停留时长分布
FR46: Epic 8 - 文化匹配模式触发率
FR47: Epic 8 - LLM 监控面板
FR48: Epic 8 - 业务健康指标
FR49: Epic 8 - 近实时更新
FR50: Epic 1 - 老板端鉴权保护
FR51: Epic 1 - 顾客端无需鉴权
FR52: Epic 1 - 速率限制
FR53: Epic 8 - LLM 调用量封顶降级
FR54: Epic 2 - QR 海报生成
FR55: Epic 2 - 海报 AI Menu 标识
FR56: Epic 7 - 好评引导提示
FR57: Epic 1 - 邮件咨询入口
FR58: Epic 8 - LLM 月度额度配置
FR59: Epic 8 - LLM 额度 80% 通知/降级
FR60: Epic 8 - LLM 额度月度重置与进度条

## Epic List

### Epic 1: 多租户基础设施与认证系统
老板通过 Google SSO 登录管理自己的餐馆；顾客通过 `/r/[slug]` 访问不同餐馆；系统具备速率限制和联系入口。
**FRs:** FR1, FR2, FR3, FR4, FR50, FR51, FR52, FR57
**NFRs:** NFR7, NFR8, NFR9, NFR10, NFR12, NFR13, NFR19

### Epic 2: 菜单管理、发布与 QR 海报
老板可以上传、编辑、发布菜单（含 AI OCR 提取），配置利润优先级和菜品可用状态，系统通过 Google Places 自动填充餐馆信息，菜单版本化保留历史，生成多租户 QR 海报。
**FRs:** FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR54, FR55
**NFRs:** NFR21

### Epic 3: 视觉设计系统与顾客推荐核心体验
顾客扫码后在暖夜食堂视觉风格下选择模式和限制，3 秒内获得个性化推荐——玻璃态卡片、菜系配色联动、信心评分、过敏原三态标签、disclaimer 永远可见。设计系统的 CSS 变量是所有后续 UX 组件的基础。
**FRs:** FR12, FR13, FR14, FR15, FR20, FR21, FR29, FR30, FR31
**NFRs:** NFR1, NFR2, NFR3, NFR11, NFR14, NFR18, NFR20
**UX-DRs:** UX-DR2, UX-DR3, UX-DR4, UX-DR5, UX-DR6, UX-DR7, UX-DR8, UX-DR16, UX-DR17, UX-DR18, UX-DR23, UX-DR24

### Epic 4: 文化感知模式切换
浏览器语言与餐馆菜系匹配时自动进入"组菜顾问"模式（人数/口味/搭配），提供低调的双向模式切换按钮，采集模式切换事件。
**FRs:** FR16, FR17, FR18, FR37
**UX-DRs:** UX-DR11

### Epic 5: AI Concierge 对话与动画体验
顾客可以通过发光球体 AI 角色进入对话面板，文字或语音描述需求获得推荐；菜系特色 Lottie 等待动画替代骨架屏；三层动画架构（Rive + Lottie + Framer Motion）完整落地。
**FRs:** FR19
**UX-DRs:** UX-DR1, UX-DR9, UX-DR10, UX-DR14, UX-DR22

### Epic 6: AI 菜品图片生成与管理
菜品无图时系统自动通过 Pixabay/Pexels/AI 混合策略生成参考图片，canonical tag 跨餐馆复用，老板可标记"图片不对"触发重新生成。
**FRs:** FR22, FR23, FR24, FR25, FR26, FR27, FR28
**NFRs:** NFR4, NFR6, NFR15, NFR23, NFR24

### Epic 7: 餐后转化与社交传播
餐后温和弹出采纳追踪弹窗，依次呈现分享入口和好评引导；一键生成精美推荐卡图片分享到 6 个社交平台。
**FRs:** FR36, FR56
**UX-DRs:** UX-DR12, UX-DR13

### Epic 8: 全链路数据采集与高级 Dashboard
系统采集全链路事件（停留时长、LLM 调用、推荐日志存档），Admin 可查看全局汇总+单店下钻 Dashboard（趋势图、采纳率、语言分布、LLM 成本监控、额度管理进度条），LLM 额度封顶自动降级。
**FRs:** FR32, FR33, FR34, FR35, FR38, FR39, FR40, FR41, FR42, FR43, FR44, FR45, FR46, FR47, FR48, FR49, FR53, FR58, FR59, FR60
**NFRs:** NFR5, NFR14, NFR22
**UX-DRs:** UX-DR15, UX-DR25

### Epic 9: 无障碍、国际化与质量保障
RTL 布局完整支持（阿拉伯语）、WCAG 2.1 AA 全面合规、所有降级路径 UI 静默处理、核心链路 E2E 测试覆盖（Playwright + axe-core）。
**NFRs:** NFR16, NFR17
**UX-DRs:** UX-DR19, UX-DR20, UX-DR21

---

## Epic 1: 多租户基础设施与认证系统

老板通过 Google SSO 登录管理自己的餐馆；顾客通过 `/r/[slug]` 访问不同餐馆；系统具备速率限制保护和邮件咨询入口。

### Story 1.1: 数据库 Schema 与多租户 Slug 路由

As a 顾客,
I want 通过 `/r/[slug]` 访问特定餐馆的推荐页,
So that 我扫码后直接进入对应餐馆的菜单和推荐。

**Acceptance Criteria:**

**Given** Drizzle ORM 已配置连接 Vercel Postgres (Neon)
**When** 开发者运行 `drizzle-kit generate && drizzle-kit migrate`
**Then** 数据库创建 `tenants` 表（id uuid PK, slug text UNIQUE, name, cuisine_type, google_place_id, rating, address, owner_id, plan, settings jsonb, created_at, updated_at）和 `menus` 表（id, tenant_id FK, payload jsonb, version int, published_at, created_at）
**And** 所有表定义在 `src/lib/db/schema.ts` 单文件中

**Given** 数据库中存在 slug 为 "pokemi" 的租户和已发布菜单
**When** 顾客访问 `/r/pokemi`
**Then** Server Component 通过 slug 查询 tenant 和最新 published menu，渲染顾客推荐页
**And** 不存在的 slug 返回 404 页面

**Given** 所有数据表包含 `tenant_id` 列
**When** 执行任何数据查询
**Then** 查询必须包含 `tenant_id` 条件（`tenants` 表自身查询除外），实现行级数据隔离（FR4）

### Story 1.2: 租户创建与 Slug 自动生成

As a Admin（创始人）,
I want 创建新餐馆租户并自动生成唯一 slug,
So that 新餐馆可以快速上线使用 CarteAI。

**Acceptance Criteria:**

**Given** Admin 已登录并在租户创建页面
**When** 输入餐馆名 "Chez Dupont" 并提交
**Then** 系统自动生成 kebab-case slug `chez-dupont`
**And** 创建新 tenant 记录并返回成功

**Given** slug "chez-dupont" 已存在
**When** 创建另一家同名餐馆
**Then** 系统自动追加城市后缀 `chez-dupont-paris`；再冲突追加数字 `chez-dupont-paris-2`（FR3）

**Given** 租户创建成功
**When** 查看创建结果
**Then** slug 一旦分配不可更改（QR 海报已打印场景）
**And** 老板端 `/admin/[slug]` 和顾客端 `/r/[slug]` 均可访问

### Story 1.3: Google SSO 认证与 Admin 路由保护

As a 餐馆老板,
I want 通过 Google 账号一键登录管理后台,
So that 无需记忆额外密码即可管理我的餐馆。

**Acceptance Criteria:**

**Given** Better Auth 已配置 Google OAuth provider
**When** 老板访问 `/login` 并点击 "Sign in with Google"
**Then** 完成 Google SSO 流程后创建 session，自动关联 tenant（通过 owner_id）
**And** 重定向到 `/admin/[slug]`

**Given** 未认证用户
**When** 访问 `/admin/[slug]` 或调用 `/api/tenants/[slug]` PATCH
**Then** 页面重定向到 `/login`；API 返回 401 Unauthorized（NFR7）

**Given** 老板已登录但访问其他老板的 `/admin/[other-slug]`
**When** Server Component 验证 session.userId !== tenant.owner_id
**Then** 返回 403 Forbidden

**Given** 顾客访问 `/r/[slug]` 或 `POST /api/recommend`
**When** 无任何认证信息
**Then** 正常访问，无需鉴权（FR51）

### Story 1.4: API 速率限制

As a 系统运维者,
I want 对关键 API 实施速率限制,
So that 防止滥用并控制 LLM 调用成本。

**Acceptance Criteria:**

**Given** Upstash Ratelimit + Redis 已配置（`KV_REST_API_URL`, `KV_REST_API_TOKEN`）
**When** 同一 IP 在 1 分钟内调用 `/api/recommend` 超过 60 次
**Then** 返回 429 Too Many Requests（NFR10）

**Given** 同一 tenant 在 1 分钟内调用 `/api/ingest` 超过 10 次
**When** 第 11 次请求到达
**Then** 返回 429 Too Many Requests

**Given** 速率限制在 Route Handler 内部检查
**When** 请求通过限制
**Then** 正常处理请求；限制检查不在 middleware 中执行（架构要求）

### Story 1.5: 邮件咨询入口

As a 潜在客户,
I want 通过 `contact@carte-ai.link` 发送咨询邮件,
So that 可以了解 CarteAI 服务并开始合作。

**Acceptance Criteria:**

**Given** Cloudflare Email Routing 已配置
**When** 用户发送邮件到 `contact@carte-ai.link`
**Then** 邮件转发到创始人的个人邮箱

**Given** 网站页脚和 Terms/Privacy 页面
**When** 用户查看联系方式
**Then** 显示 `contact@carte-ai.link` 邮箱地址（FR57）

---

## Epic 2: 菜单管理、发布与 QR 海报

老板可以上传、编辑、发布菜单（含 AI OCR 提取），配置利润优先级和菜品可用状态，系统通过 Google Places 自动填充餐馆信息，菜单版本化保留历史，生成多租户 QR 海报。

### Story 2.1: 菜单文件上传与 AI OCR 提取

As a 餐馆老板,
I want 拍照或上传 PDF 菜单，系统自动提取结构化菜单草稿,
So that 不需要逐道菜手动输入即可快速数字化菜单。

**Acceptance Criteria:**

**Given** 老板已登录并在菜单管理页面
**When** 上传一张菜单照片或 PDF 文件到 `/api/ingest`
**Then** 系统调用 LLM（Anthropic 主/OpenAI 兜底）进行 OCR 提取
**And** 返回结构化菜单草稿（菜名法语+英语+中文翻译、价格、推测过敏原、分类）（FR5）

**Given** OCR 提取完成
**When** 查看提取结果
**Then** 草稿标记为"待审核"状态，不自动发布

**Given** LLM OCR 调用失败
**When** 主 provider (Anthropic) 不可用
**Then** 自动切换到 OpenAI 兜底；两者都失败时提示用户手动录入

### Story 2.2: 菜单草稿审核与编辑

As a 餐馆老板,
I want 审核并编辑 AI 提取的菜单草稿,
So that 确保菜品信息准确后再发布给顾客。

**Acceptance Criteria:**

**Given** 菜单草稿已生成
**When** 老板在 MenuEditor 中编辑菜品
**Then** 可修改菜名（三语）、价格、描述、过敏原标注、分类、标签（FR6）

**Given** 老板编辑某道菜
**When** 切换 available 开关
**Then** 该菜品的可用状态立即更新为 true/false（FR8）

**Given** 老板编辑某道菜
**When** 设置 marginPriority 值
**Then** 可选择 1（低）/2（中）/3（高）利润优先级，影响推荐排序权重（FR9）

**Given** 老板保存编辑
**When** 调用 `PUT /api/menus/[slug]`
**Then** 更新菜单数据，Zod 校验通过后持久化

### Story 2.3: 菜单发布与版本化

As a 餐馆老板,
I want 发布审核完成的菜单，系统自动保留历史版本,
So that 顾客看到最新菜单且我可以回溯历史变更。

**Acceptance Criteria:**

**Given** 菜单编辑完成
**When** 老板点击"发布"
**Then** 系统创建新的 menu 记录（version 递增），设置 `published_at` 时间戳（FR7, FR11）
**And** 顾客端 `/r/[slug]` 立即加载最新版本

**Given** 已发布过 3 个版本
**When** 查看菜单历史
**Then** 可查看所有历史版本记录（version 1, 2, 3），每个版本保留完整 payload（NFR21）

### Story 2.4: Google Places 餐馆信息自动填充

As a 餐馆老板,
I want 系统通过 Google Places 搜索并自动填充餐馆信息,
So that 不需要手动输入名称、地址、评分等基本信息。

**Acceptance Criteria:**

**Given** 老板在创建或设置餐馆时
**When** 输入餐馆名称搜索
**Then** 调用 Google Places API v1 返回匹配结果列表

**Given** 老板选择了一个 Google Places 结果
**When** 确认选择
**Then** 自动填充 tenant 的 name、address、google_place_id、rating、cuisine_type（FR10）

**Given** Google Places API 不可用
**When** 搜索请求失败
**Then** 提示用户手动填写餐馆信息，不阻塞流程

### Story 2.5: 多租户 QR 海报生成

As a 餐馆老板,
I want 为我的餐馆生成可打印的 QR 海报,
So that 顾客扫桌上二维码即可进入我的 CarteAI 推荐页。

**Acceptance Criteria:**

**Given** 老板已创建餐馆并发布菜单
**When** 访问 `/admin/[slug]/poster`
**Then** 生成包含真实二维码的海报，QR 码指向 `https://carte-ai.link/r/[slug]`（FR54）
**And** 海报包含 "AI Menu · 19 Languages" 标识（FR55）

**Given** 海报已生成
**When** 老板点击下载
**Then** 导出可打印的 PDF 或高清图片

---

## Epic 3: 视觉设计系统与顾客推荐核心体验

顾客扫码后在暖夜食堂视觉风格下选择模式和限制，3 秒内获得个性化推荐——玻璃态卡片、菜系配色联动、信心评分、过敏原三态标签、disclaimer 永远可见。

### Story 3.1: 设计系统基础——CSS 变量、菜系配色、字号与间距

As a 顾客,
I want 页面视觉风格自动匹配餐馆菜系（中餐红、法餐蓝、印度橙...）,
So that 感受到"这个页面就是这家店的感觉"。

**Acceptance Criteria:**

**Given** `globals.css` 中定义 CSS 变量
**When** 页面加载
**Then** 默认主题使用暖色调：底色 `#0a0a0f`，主色 amber-300，辅色 orange-200，光晕 amber-400/20（UX-DR16）

**Given** 页面 `<html>` 标签设置 `data-cuisine` 属性
**When** `data-cuisine="chinese_restaurant"`
**Then** CSS 变量自动切换为中餐主题（primary red-400, accent amber-300, glow red-400/20）
**And** 支持全部 11 套菜系配色 + 1 默认（UX-DR2）

**Given** 字号系统已定义
**When** 渲染页面文字
**Then** 遵循层级：Display 28px/H1 24px/H2 20px/H3 16px/Body 15px（行高1.6）/Body Small 13px/Caption 11px/Price 18px tabular-nums（UX-DR17）

**Given** 间距系统基于 4px 基准
**When** 布局组件
**Then** 顾客端最大宽度 480px，所有触控目标 ≥44x44px，预留 safe-area-inset-bottom（UX-DR18）

### Story 3.2: RestaurantHeader 首屏组件

As a 顾客,
I want 扫码后首屏立即看到餐馆名称、菜系和评分,
So that 确认"我在对的地方"并建立信任。

**Acceptance Criteria:**

**Given** 顾客访问 `/r/[slug]`
**When** 页面加载
**Then** 首屏展示 RestaurantHeader：餐馆名（Display 28px 字号）+ 菜系标签 + 地址（UX-DR3）
**And** 背景使用菜系光晕渐变（`--carte-glow`）

**Given** 餐馆 Google 评分 ≥4.5
**When** 渲染 RestaurantHeader
**Then** 显示评分标识

**Given** 餐馆评分 <4.5 或无评分数据
**When** 渲染 RestaurantHeader
**Then** 不显示评分区域

### Story 3.3: ModeSelector 与 AllergenChipGroup 组件

As a 顾客,
I want 通过大按钮选择推荐模式并快速勾选饮食限制,
So that 无需打字即可表达"我想吃什么"。

**Acceptance Criteria:**

**Given** 首屏渲染完成
**When** 顾客看到交互区
**Then** 展示 5 个模式大按钮 2×3 网格：🆕第一次来/💰≤10€/⭐招牌菜/🥗健康/🍻分享（FR12, UX-DR4）
**And** 按钮支持 `role="radiogroup"` 键盘方向键导航

**Given** 顾客选择了一个模式
**When** 点击按钮
**Then** 选中项高亮（菜系配色），其余半透明
**And** 下方展开 AllergenChipGroup

**Given** AllergenChipGroup 已展开
**When** 顾客勾选饮食限制
**Then** 提供 chip toggle（不辣/素食/不吃牛/不吃海鲜/无奶/无麸质），多选，配色跟随菜系（FR13, UX-DR5）
**And** 每个 chip 支持 `aria-pressed` 状态

**Given** 限制 chip 可跳过
**When** 顾客不勾选任何限制直接提交
**Then** 正常发起推荐请求

### Story 3.4: RecommendationCard、AllergenBadge 与 ConfidenceScore 组件

As a 顾客,
I want 看到精美的推荐卡片，包含图片、理由、价格、过敏原状态和信心评分,
So that 一张卡片就能让我做出点菜决策。

**Acceptance Criteria:**

**Given** 推荐结果返回
**When** 渲染 RecommendationCard
**Then** 玻璃态毛玻璃卡片包含：菜品大图（100%宽×160px）+ 菜名原名+翻译 + 价格 + 推荐理由 + AllergenBadge + ConfidenceScore（UX-DR6）
**And** 卡片边框颜色跟随菜系配色 `var(--carte-primary)/20`
**And** 底部固定显示 disclaimer（FR29, NFR11）

**Given** 多张推荐卡返回
**When** 依次入场
**Then** Framer Motion staggered 弹跳动画，每张间隔 200ms（UX-DR23）

**Given** 菜品过敏原状态为 safe
**When** 渲染 AllergenBadge
**Then** 显示 ✅ 绿色（`--carte-success`）+ "No [allergen]"（UX-DR7）

**Given** 菜品过敏原数据缺失（unknown）
**When** 渲染 AllergenBadge
**Then** 显示 ⚠️ 橙色（`--carte-warning`）高亮加粗 + "Data incomplete — check with staff"（FR30, UX-DR7）

**Given** 推荐信心评分 ≥80%
**When** 渲染 ConfidenceScore
**Then** 绿色（`--carte-confidence-high`）显示百分比数字（UX-DR8）
**And** 50-80% 黄色，<50% 橙色

**Given** AI 生成的菜品图片
**When** 渲染卡片图片区
**Then** 图片标注 "AI Generated · For Reference" badge（UX-DR24）

### Story 3.5: 推荐 API 集成与双层引擎

As a 顾客,
I want 3 秒内获得个性化推荐结果,
So that 快速做出点菜决策而无需翻阅完整菜单。

**Acceptance Criteria:**

**Given** 顾客提交推荐请求（模式 + 限制 + 语言）
**When** `POST /api/recommend` 处理请求
**Then** 系统先运行本地规则引擎筛选候选菜品，LLM 仅在候选子集内增强排序和生成理由（FR20）
**And** 推荐结果以顾客浏览器语言展示（19 种语言）（FR15）

**Given** 推荐返回
**When** 渲染结果
**Then** 3~4 道菜品，含本地化理由、价格（EUR 整数分）、过敏原标注、信心评分（FR14）
**And** P95 响应时间 ≤3 秒（NFR1）

**Given** LLM 调用失败（Anthropic + OpenAI 均不可用）
**When** 降级处理
**Then** 自动使用本地规则结果，顾客端无任何"AI 不可用"提示，体验不中断（FR21, NFR20）

**Given** 任何推荐结果（LLM 成功/降级/错误）
**When** 渲染结果页
**Then** 过敏原免责 disclaimer "请向服务员确认过敏原" 100% 出现（NFR11）

**Given** LLM 处理推荐请求
**When** 生成推荐内容
**Then** 严格执行 6 条安全护栏：不发明菜品/价格/过敏原/卡路里，数据缺失强制提醒，仅输出 valid JSON（FR31）

### Story 3.6: 顾客体验页面组装

As a 顾客,
I want 扫码后体验完整流畅的推荐流程（首屏→选模式→看推荐→浏览菜单）,
So that 整个点菜辅助体验自然连贯。

**Acceptance Criteria:**

**Given** 顾客访问 `/r/[slug]`
**When** 页面加载
**Then** SSR 加载餐馆数据 + 菜系配色注入 + 菜单数据，首屏加载 ≤2 秒（NFR3）
**And** 页面组装顺序：RestaurantHeader → ModeSelector → AllergenChipGroup → RecommendationCards → MenuBrowser 入口

**Given** 推荐结果已展示
**When** 顾客点击"查看完整菜单"
**Then** 进入 MenuBrowser 分类浏览视图（Tabs 按分类切换），可随时返回推荐

**Given** 顾客在推荐页操作
**When** 语言切换器切换语言
**Then** 所有 UI 文案和推荐结果以新语言重新渲染

---

## Epic 4: 文化感知模式切换

浏览器语言与餐馆菜系匹配时自动进入"组菜顾问"模式，提供双向模式切换按钮，采集模式事件。

### Story 4.1: 文化感知检测与自动模式切换

As a 中国顾客在中餐馆,
I want 系统自动识别我不需要翻译而是需要组菜搭配建议,
So that 获得真正适合我的推荐体验而非通用翻译器。

**Acceptance Criteria:**

**Given** 顾客浏览器语言为 zh 且餐馆 cuisine_type 为 chinese
**When** 访问 `/r/[slug]`
**Then** 自动进入"组菜顾问"模式 UI，首屏标题变为"几位用餐？"而非"What would you like?"（FR16）

**Given** 浏览器语言 ja + 餐馆 cuisine_type japanese
**When** 访问页面
**Then** 同样触发文化匹配模式

**Given** 浏览器语言 en + 餐馆 cuisine_type chinese
**When** 访问页面
**Then** 进入默认"入门推荐"模式（不触发文化匹配）

### Story 4.2: 组菜顾问模式 UI

As a 文化匹配的顾客,
I want 输入用餐人数和口味偏好后获得荤素搭配的套餐推荐,
So that 省去"谁来点菜"的纠结。

**Acceptance Criteria:**

**Given** 组菜模式已激活
**When** 顾客操作
**Then** 展示人数选择（1-8+）+ 忌口 chip + 口味偏好选择（辣度/清淡/都行）（FR17）

**Given** 顾客提交组菜请求（5 人/不吃香菜/微辣）
**When** AI 生成推荐
**Then** 返回套餐组合：分类标签（热菜/凉菜/汤/主食）+ 总价 + 人均价
**And** 使用 ComboMealCard 组件展示（UX-DR11）

**Given** 组菜模式推荐结果
**When** 渲染 ComboMealCard
**Then** 一张卡包含多道菜品列表，每道菜有分类标签，底部显示总价 + 人均计算
**And** 菜名仅显示原名（文化匹配不需翻译）

### Story 4.3: 双向模式切换按钮与事件采集

As a 顾客,
I want 可以在"入门推荐"和"组菜顾问"模式之间自由切换,
So that 不被系统的自动判断限制住。

**Acceptance Criteria:**

**Given** 当前处于组菜模式
**When** 顾客查看页面底部
**Then** 显示低调链接："第一次来这家？看看招牌菜 →"（FR18）

**Given** 当前处于入门推荐模式
**When** 顾客查看页面底部
**Then** 显示低调链接："熟悉这家菜？试试组菜模式 →"

**Given** 顾客点击模式切换链接
**When** 切换完成
**Then** 页面 UI 切换到目标模式，无需重新加载
**And** 系统采集 `mode_switch` 事件到 analytics_events 表（event_type='mode_switch', payload 含 from/to 模式）（FR37）

**Given** 文化匹配模式自动触发
**When** 系统检测到匹配
**Then** 采集 `cultural_match` 事件（event_type='cultural_match', payload 含 browser_lang/cuisine_type）（FR37）

---

## Epic 5: AI Concierge 对话与动画体验

顾客可以通过发光球体 AI 角色进入对话面板，文字或语音描述需求获得推荐；菜系特色 Lottie 等待动画替代骨架屏。

### Story 5.1: CuisineLoader 菜系等待动画

As a 顾客,
I want 等待推荐时看到餐馆菜系特色的趣味动画,
So that 等待变成愉悦体验而非焦虑。

**Acceptance Criteria:**

**Given** 推荐请求已发送，等待响应
**When** 渲染加载状态
**Then** 全屏居中展示 Lottie 动画，按 restaurant_type 路由到对应动画（中餐筷子旋转/法餐红酒摇晃/通用刀叉转圈等）（UX-DR10）

**Given** 无匹配菜系动画
**When** 渲染加载状态
**Then** 播放通用默认 Lottie 动画（刀叉转圈）

**Given** 推荐返回成功
**When** 动画过渡
**Then** 动画过渡到完成态然后淡出，推荐卡接力入场

**Given** 用户系统设置 `prefers-reduced-motion`
**When** 渲染加载状态
**Then** 替换为静态图标 + 文字 "Preparing your recommendations..."（无障碍要求）

**Given** Lottie 动画文件
**When** 打包
**Then** 使用 `next/dynamic` 动态 import `lottie-react`，不打入首屏 bundle

### Story 5.2: AIConciergeOrb Rive 角色

As a 顾客,
I want 看到一个可爱的发光球体 AI 角色邀请我对话,
So that 感受到"这个 AI 有人格，像朋友在帮我"。

**Acceptance Criteria:**

**Given** 顾客页面加载完成
**When** 渲染浮动层
**Then** 右下角固定展示 AIConciergeOrb（bottom: 24px, right: 16px），idle 状态微笑浮动 + 微妙脉冲光晕（UX-DR9）

**Given** AI 角色 idle 状态
**When** 一段时间后
**Then** 角色冒泡提示"需要帮忙点菜吗？"

**Given** 推荐请求发送中
**When** AI 角色状态
**Then** 切换到 thinking 状态（眨眼 + 冒泡动画）

**Given** 推荐返回成功
**When** AI 角色状态
**Then** 切换到 excited 状态（光晕扩大 + 弹跳）

**Given** 过敏原警告出现
**When** AI 角色状态
**Then** 切换到 concerned 状态（光晕变橙色）

**Given** Rive 动画文件
**When** 打包
**Then** 使用 `next/dynamic` 动态 import `@rive-app/react-canvas`，不打入首屏 bundle

**Given** AI 角色球
**When** 无障碍检查
**Then** `aria-label="AI 点菜助手"`, `role="button"`, 键盘 Enter/Space 触发

### Story 5.3: AI 对话面板与文字输入

As a 顾客,
I want 点击 AI 角色后用对话方式描述我的需求,
So that 用自然语言表达"3 个人不辣人均 15 欧"。

**Acceptance Criteria:**

**Given** 顾客点击 AIConciergeOrb
**When** 面板弹出
**Then** 从底部半屏弹出 AI 对话 Sheet（shadcn Sheet bottom），不全屏覆盖（UX-DR22）
**And** AI 角色球隐藏（hidden 状态）

**Given** 对话面板打开
**When** AI 发送首条消息
**Then** 显示"你好！几位用餐？有什么忌口吗？"，对话风格为"朋友"语气（UX-DR22）
**And** 文字逐句出现（打字效果）

**Given** 顾客输入文字需求（"3个人，不要太辣，预算人均15欧"）
**When** 发送消息
**Then** AI 处理需求并返回推荐结果，推荐卡从对话面板上方弹出（FR19）

**Given** 对话面板打开
**When** 顾客点击收起
**Then** 面板收起，AI 角色球重新显示在右下角

### Story 5.4: VoiceInputButton 语音输入

As a 顾客,
I want 在 AI 对话中用语音描述需求,
So that 比打字更方便快捷。

**Acceptance Criteria:**

**Given** AI 对话面板已打开
**When** 顾客看到输入区域
**Then** 文字输入框旁显示 VoiceInputButton 麦克风按钮（UX-DR14）

**Given** 顾客长按 VoiceInputButton
**When** 录音中
**Then** 显示波形动画 + 红色录音指示，AI 角色球切换到 listening 状态（脉冲随声音节奏）

**Given** 顾客松手结束录音
**When** 处理语音
**Then** 调用 Web Speech API 转文字，文字自动发送到对话

**Given** VoiceInputButton 无障碍
**When** 键盘操作
**Then** `aria-label="按住说话"`, 键盘 Space 长按触发

**Given** 浏览器不支持 Web Speech API
**When** 渲染输入区域
**Then** VoiceInputButton 不显示，仅保留文字输入

### Story 5.5: 三层动画架构集成

As a 开发者,
I want 三层动画库（Rive + Lottie + Framer Motion）协调工作且不影响性能,
So that 用户体验流畅且 bundle 大小可控。

**Acceptance Criteria:**

**Given** 三层动画架构
**When** 首屏加载
**Then** Rive 和 Lottie 均通过 `next/dynamic` 懒加载，首屏 bundle 不包含动画库（UX-DR1）

**Given** 所有动画组件
**When** 用户系统设置 `prefers-reduced-motion`
**Then** Rive 角色静止、Lottie 替换为静态文字、Framer Motion 动画跳过（duration: 0）

**Given** 三层动画分工
**When** 检查实现
**Then** Rive 仅用于 AIConciergeOrb（有状态角色）；Lottie 仅用于 CuisineLoader（插画等待）；Framer Motion 用于所有 UI 层动画（入场、过渡、微交互）

---

## Epic 6: AI 菜品图片生成与管理

菜品无图时系统自动通过 Pixabay/Pexels/AI 混合策略生成参考图片，canonical tag 跨餐馆复用，老板可标记"图片不对"触发重新生成。

### Story 6.1: Canonical Tag 生成与图片表

As a 系统,
I want 为每道菜生成标准化 canonical tag,
So that 相同菜品跨餐馆复用同一张图片节省成本。

**Acceptance Criteria:**

**Given** 数据库 schema
**When** 迁移运行
**Then** 创建 `dish_images` 表（id uuid PK, canonical_tag text UNIQUE, image_url text, source text, attribution text, prompt_hash text, status text, created_at）

**Given** 菜品名称为 "鱼香肉丝" / "Yu Xiang Shredded Pork"
**When** 调用 LLM 生成 canonical tag
**Then** 返回标准化 tag 如 `yuxiang-shredded-pork`（FR25）

**Given** 不同餐馆有 "鱼香肉丝" 和 "Yu Xiang Rou Si"
**When** AI 判断菜品相同性
**Then** 识别为同一道菜，分配相同 canonical tag（FR26）
**And** 查 dish_images 表已有该 tag 的图片时直接复用

### Story 6.2: Pixabay/Pexels 图片搜索集成

As a 系统,
I want 优先从免费图库搜索菜品图片,
So that 80%+ 菜品零成本获得高质量图片。

**Acceptance Criteria:**

**Given** 菜品无图片且 dish_images 中无匹配 canonical tag
**When** 触发图片搜索
**Then** 先调用 Pixabay API 按菜名搜索（FR22）
**And** 有结果时取最佳匹配图，记录 source='pixabay'

**Given** Pixabay 无结果
**When** 触发备选搜索
**Then** 调用 Pexels API 搜索
**And** 有结果时取图 + 记录署名 attribution（Pexels 要求），source='pexels'

**Given** 图片搜索完成
**When** 保存到 dish_images 表
**Then** 通过 canonical tag 索引，后续同一菜品直接复用（FR25, NFR15）

**Given** 图片搜索和生成
**When** 菜单发布流程
**Then** 图片生成为异步操作，不阻塞菜单发布；图片未就绪时展示占位图（NFR4）

### Story 6.3: AI 图片生成兜底

As a 系统,
I want 当免费图库找不到匹配图片时用 AI 生成,
So that 每道菜都有参考图片。

**Acceptance Criteria:**

**Given** Pixabay 和 Pexels 均无结果
**When** 触发 AI 生成
**Then** 使用菜品名 + 描述 + 菜系 + 食材构建 prompt，调用 DALL-E 3 生成图片（FR23）

**Given** AI 生成的图片
**When** 存储
**Then** 存储到 Vercel Blob，URL 记录到 dish_images 表，source='ai_generated'，记录 prompt_hash（FR27）

**Given** AI 生成的菜品图片
**When** 展示给顾客
**Then** 图片标注 "AI Generated · For Reference" 标识（FR24）

**Given** AI 图片生成
**When** 检查质量
**Then** 图片与实际菜品视觉相似度达到可辨认水平，不出现明显菜系/食材错误（NFR23）

**Given** 单次 AI 图片生成
**When** 执行
**Then** 请求 ≤30 秒完成（后台异步）（NFR6）

### Story 6.4: 老板图片审核与重新生成

As a 餐馆老板,
I want 在菜单审核时标记"图片不准确"触发重新生成,
So that 确保顾客看到的图片能代表我的实际菜品。

**Acceptance Criteria:**

**Given** 老板在 MenuEditor 中查看菜品图片
**When** 认为图片不准确
**Then** 可点击"图片不对"按钮标记（FR28）

**Given** 图片被标记不准确
**When** 系统处理
**Then** 删除当前 dish_images 记录，重新走搜索/生成流程（Pixabay → Pexels → AI）
**And** canonical tag 可被修正（NFR24）

---

## Epic 7: 餐后转化与社交传播

餐后温和弹出采纳追踪弹窗，依次呈现分享入口和好评引导；一键生成精美推荐卡图片分享到社交平台。

### Story 7.1: 餐后采纳追踪弹窗

As a 系统运营者,
I want 在顾客停留足够时间后温和询问是否点了推荐菜,
So that 收集推荐采纳率数据验证产品价值。

**Acceptance Criteria:**

**Given** 顾客在推荐页停留超过 5 分钟
**When** 触发餐后流程
**Then** 居中弹出 Dialog（shadcn）："您点了推荐菜吗？" + [是] [否] 按钮（FR36）
**And** 半透明遮罩，一键回答

**Given** 顾客回答是或否
**When** 提交回答
**Then** 采集 `adoption` 事件到 analytics_events 表（payload 含 adopted: true/false）
**And** Dialog 关闭

**Given** 餐后弹窗
**When** 设计交互
**Then** 温和非侵入——弹窗可关闭忽略，不阻塞页面使用

### Story 7.2: SharePanel 社交分享

As a 顾客,
I want 一键分享我的推荐体验到社交平台,
So that 朋友们也能知道这家餐馆的 AI 点菜体验。

**Acceptance Criteria:**

**Given** 顾客回答了采纳弹窗
**When** 弹窗关闭后
**Then** 底部浮现 SharePanel 入口按钮（依次出现，不与弹窗同时）（UX-DR13）

**Given** 顾客点击分享按钮
**When** SharePanel 打开
**Then** 从底部半屏弹出（shadcn Sheet bottom），展示推荐卡图片预览 + 6 个平台按钮（Instagram/Facebook/Snapchat/X/WhatsApp/复制链接）（UX-DR12）

**Given** SharePanel 打开
**When** 查看分享内容
**Then** 自动生成精美推荐卡图片（菜品图 + 菜名 + 餐馆名 + "Recommended by AI"）
**And** 预填多语言文案可编辑："在 [餐馆名] 让 AI 帮我点菜，推荐太准了！"

**Given** 顾客选择分享平台
**When** 点击平台按钮
**Then** 调用 Web Share API 或平台 deep link 分享
**And** 每个平台按钮 `aria-label` 含平台名

### Story 7.3: 好评引导与餐后时序编排

As a 餐馆老板,
I want 餐后自然引导满意的顾客去留好评,
So that 增加餐馆在 Google Maps 上的好评数。

**Acceptance Criteria:**

**Given** 分享入口已浮现
**When** 分享入口下方
**Then** 展示低调的好评引导小提示（非侵入式，如"觉得不错？在 Google Maps 留个好评"）（FR56）

**Given** 整个餐后流程
**When** 编排时序
**Then** PostMealPrompt 组件编排：①采纳弹窗 → ②底部浮现分享入口 + 好评引导 — 依次出现不同时轰炸（UX-DR13）

**Given** 顾客不想互动
**When** 忽略所有餐后提示
**Then** 提示自然消失或可关闭，不影响页面正常使用

---

## Epic 8: 全链路数据采集与高级 Dashboard

系统采集全链路事件，Admin 可查看全局汇总+单店下钻 Dashboard，LLM 额度封顶自动降级。

### Story 8.1: 全链路事件采集管道

As a 系统,
I want 采集顾客端全链路行为事件,
So that 为 Dashboard 分析和合规审计提供数据基础。

**Acceptance Criteria:**

**Given** 顾客扫码访问 `/r/[slug]`
**When** 页面加载
**Then** 采集 `scan` 事件（tenant_id + timestamp + 语言 + referrer）（FR33）

**Given** 顾客发起推荐请求
**When** 推荐返回
**Then** 采集 `recommend_view` 事件（模式/限制条件/结果数/provider/延迟 ms）（FR34）

**Given** 顾客在页面停留
**When** 页面 beforeunload 或 visibilitychange
**Then** 采集 `dwell` 事件（页面进入→离开的秒数）（FR35）

**Given** 推荐 API 调用 LLM
**When** LLM 返回
**Then** 采集 `llm_call` 事件（provider/模型/token 数/成本/是否降级）存入 analytics_events（FR38）

**Given** 含过敏原过滤的推荐请求
**When** 推荐完成
**Then** 自动存档到 recommendations_log 表（tenant_id + timestamp + allergens_filtered + request + response + provider + latency_ms）（FR32）

**Given** 所有埋点数据
**When** 采集
**Then** 仅匿名行为数据（session_id 为匿名生成），不采集 PII（FR39, NFR8）
**And** 前端通过 `navigator.sendBeacon` 异步发送，写入失败不影响推荐功能（NFR22）

### Story 8.2: DashboardMetricCard 与全局概览

As a 创始人/Admin,
I want 一眼看到所有餐馆的核心指标概览,
So that 快速判断产品整体健康度。

**Acceptance Criteria:**

**Given** Admin 访问 `/admin` 全局 Dashboard
**When** 页面加载
**Then** 展示 DashboardMetricCard 组件：大数字 + 单位 + 趋势箭头（↑↓）+ 百分比变化 + 描述标签（UX-DR15）
**And** 三态颜色：positive 绿/negative 红/neutral 灰

**Given** 全局概览
**When** 查看核心指标
**Then** 展示日活/周活餐馆数、每餐馆日均扫码（FR48）
**And** 页面加载 ≤3 秒（NFR5）

**Given** Dashboard 数据
**When** 刷新
**Then** 近实时更新（分钟级），Server Component 直连 DB 聚合查询（FR49）

### Story 8.3: 单餐馆下钻 Dashboard

As a 餐馆老板,
I want 查看我的餐馆的详细数据分析,
So that 了解顾客行为并证明 CarteAI 的价值。

**Acceptance Criteria:**

**Given** 老板访问 `/admin/[slug]` Dashboard
**When** 页面加载
**Then** 展示扫码量趋势图（按时段/天/周，支持时间范围选择）（FR42）
**And** 推荐模式分布饼图（first_time/cheap/healthy/signature/sharing 占比）（FR43）

**Given** Dashboard 详细数据
**When** 查看更多指标
**Then** 展示顾客语言分布（饼图）和停留时长分布（FR45）
**And** Admin 可从全局视图下钻到任一餐馆的详细视图（FR41）

**Given** Dashboard 布局
**When** 渲染
**Then** 左侧导航栏（📊概览/📋菜单/🎨海报/⚙️设置）+ 主区域数据卡 + 图表（UX-DR25）
**And** 响应式栅格：桌面 12 列/平板 6 列/手机 1 列

### Story 8.4: 高级 Dashboard 指标

As a 创始人,
I want 查看推荐采纳率、文化匹配率和 LLM 成本监控,
So that 验证核心创新点的效果并控制成本。

**Acceptance Criteria:**

**Given** Dashboard 高级指标区
**When** 查看推荐采纳率
**Then** 展示采纳率趋势图（弹窗 Yes/No 反馈百分比随时间变化）（FR44）

**Given** Dashboard 文化感知区
**When** 查看
**Then** 展示文化匹配模式触发率和"第一次来这家？"按钮点击率（FR46）

**Given** Dashboard LLM 监控区
**When** 查看
**Then** 展示每餐馆 LLM 调用量/成本累计/降级次数/provider 分布（FR47）

### Story 8.5: LLM 额度管理与自动降级

As a 系统运维者,
I want 按餐馆追踪和封顶 LLM 使用量,
So that 控制运营成本并在超限时自动降级。

**Acceptance Criteria:**

**Given** `llm_usage` 表按 tenant_id + month 追踪
**When** 每次 LLM 调用完成
**Then** 异步 UPDATE call_count + token_count + cost_cents（FR53）

**Given** Admin 在 Dashboard 中
**When** 查看 LLM 额度
**Then** 展示当月已用/剩余额度进度条（FR60）
**And** 可配置每家餐馆的月度额度上限（默认按订阅档位，支持手动覆盖）（FR58）

**Given** Starter 档位餐馆 LLM 使用量达到额度 80%
**When** 下一次推荐请求到达
**Then** 自动降级到纯本地规则，顾客端无感知（FR59, NFR14）

**Given** Pro 档位餐馆 LLM 使用量达到额度 80%
**When** 达到阈值
**Then** 通知老板（软上限），继续允许 LLM 调用直到 100%（FR59）

**Given** 自然月 1 号
**When** 月度重置
**Then** 新月创建新 llm_usage 行（不删旧行），额度重置（FR60）

---

## Epic 9: 无障碍、国际化与质量保障

RTL 布局完整支持、WCAG 2.1 AA 全面合规、降级路径 UI 静默处理、E2E 测试覆盖。

### Story 9.1: RTL 布局支持

As a 阿拉伯语顾客,
I want 页面自动切换为从右到左布局,
So that 用我习惯的阅读方向使用 CarteAI。

**Acceptance Criteria:**

**Given** 顾客浏览器语言为阿拉伯语
**When** 语言检测完成
**Then** 页面 `<html>` 设置 `dir="rtl"`，所有布局自动镜像（UX-DR19, NFR16）

**Given** RTL 模式
**When** 渲染页面
**Then** 导航、卡片、文字对齐、图标方向全部镜像
**And** 19 种语言（含 RTL 阿拉伯语）正确渲染

### Story 9.2: WCAG 2.1 AA 合规审计与修复

As a 有视觉障碍的顾客,
I want 页面满足 WCAG 2.1 AA 无障碍标准,
So that 我可以通过屏幕阅读器或键盘使用 CarteAI。

**Acceptance Criteria:**

**Given** 所有文字内容
**When** 检查对比度
**Then** 正文 ≥4.5:1、大字 ≥3:1 对比度（UX-DR20, NFR17）
**And** 每套菜系动态配色均通过对比度验证

**Given** 所有可交互元素
**When** 键盘 Tab 导航
**Then** Tab 序逻辑合理，focus ring 可见（shadcn 内置）

**Given** 推荐卡组件
**When** 屏幕阅读器访问
**Then** 使用 `<article>` 语义标签，图片含 alt 文字（菜名），过敏原标签含 `aria-label` 完整信息

**Given** 过敏原 disclaimer
**When** 渲染
**Then** 使用 `role="alert"` 确保屏幕阅读器即时播报

**Given** 过敏原信息传达
**When** 色盲用户查看
**Then** 图标 + 颜色 + 文字三重编码，不仅靠颜色传达信息（NFR18）

### Story 9.3: 降级路径 UI 静默处理

As a 顾客,
I want 即使后台服务出现故障也能正常使用推荐功能,
So that 我的点菜体验不受技术问题影响。

**Acceptance Criteria:**

**Given** LLM 调用失败（Anthropic + OpenAI）
**When** 降级到本地规则
**Then** 推荐结果正常展示，无"AI 不可用"等错误提示，用户零感知（UX-DR21）

**Given** 菜品图片加载失败（Pixabay/Pexels/Vercel Blob）
**When** 渲染菜品卡
**Then** 显示占位图，不显示 broken image 图标

**Given** Google Places API 不可用
**When** 餐馆信息加载
**Then** 使用 tenant 表已有的手动填写数据，不报错

**Given** 任何外部依赖故障
**When** 检查核心功能
**Then** 推荐功能不中断（NFR20），所有降级路径均有对应的静默处理逻辑

### Story 9.4: E2E 测试套件

As a 开发者,
I want 核心链路有 E2E 测试覆盖,
So that 每次发布前自动验证关键功能不被破坏。

**Acceptance Criteria:**

**Given** Playwright 已安装
**When** 编写 E2E 测试
**Then** 覆盖以下核心链路：
- 顾客端：扫码 → 选模式 → 看推荐 → 浏览菜单（`e2e/customer-flow.spec.ts`）
- 老板端：登录 → Dashboard → 编辑菜单 → 发布（`e2e/admin-flow.spec.ts`）
- 认证：Google SSO 登录/登出（`e2e/auth.spec.ts`）

**Given** axe-core 已安装
**When** E2E 测试运行
**Then** 每个页面自动执行 axe-core 无障碍扫描，WCAG 2.1 AA 违规标记为测试失败

**Given** CI/CD 配置
**When** PR 提交或 push main
**Then** GitHub Actions 自动运行 lint + build + Playwright E2E + axe-core a11y
