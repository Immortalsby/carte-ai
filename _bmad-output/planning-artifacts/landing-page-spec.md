# CarteAI Landing Page 规范文档

**作者：** Mary (Business Analyst) + Boyuan
**日期：** 2026-05-06
**状态：** Draft v1

---

## 一、战略定位

### 页面使命

Landing Page 是 CarteAI 的**唯一公开销售页面**。它的工作是把"路过的人"变成"注册试用的餐馆老板"。次要目标是给潜在合作伙伴/投资人留下专业印象。

### 目标受众

| 优先级 | 受众 | 来源 | 他们想知道 | 转化目标 |
|--------|------|------|-----------|---------|
| **P0** | 法国独立餐馆老板 | 口碑、搜索、门口海报 | "这东西能帮我赚钱吗？" | 注册免费试用 |
| **P1** | 餐饮连锁/集团决策者 | LinkedIn、行业展会 | "能否规模化部署？ROI 如何？" | 填写 contact form |
| **P2** | 投资人/潜在合作伙伴 | pitch deck 链接、口碑 | "市场多大？壁垒在哪？团队是谁？" | 了解产品 → 联系创始人 |

### 核心转化漏斗

```
注意力 → 共鸣（痛点） → 信任（功能+证据） → 欲望（收益+定价） → 行动（注册/联系）
```

---

## 二、品牌调性

### 整体风格

| 维度 | 定义 | 不要 |
|------|------|------|
| 语气 | 专业但亲切，像一个懂行的朋友在推荐工具 | 不要过度营销，不要夸张承诺 |
| 视觉 | 深色背景 (#050507) + emerald 绿 (#10b981) + 金色点缀 (#d4a574) | 不要渐变彩虹、不要 stock photo 风格 |
| 排版 | 大标题简洁有力（≤12 字），正文用数据说话 | 不要长段落，不要一屏超过 3 个要点 |
| 节奏 | 每个 section 有且仅有一个核心信息 | 不要在同一区域同时推销多个卖点 |

### Cloché 品牌形象规范

Cloché 是 CarteAI 的视觉灵魂。**logo 剪影永远不变**，通过两个微变化赋予生命：

1. **穹顶上的单只眼睛** — 一个墨点 + 高光，每 ~4s 眨一次。不加第二只眼、不加嘴型、不加四肢。
2. **盖缝即嘴巴** — Cloché 说话时穹顶从右侧铰链掀起 3-5px，露出底板与穹顶之间的暗色缝隙。

**SVG 结构层级（从后到前）：** sparkle → mouth-cavity → plate → dome（含 eye）

**动画状态：**

| 状态 | 穹顶 | 眼睛 | 星星 | 用途 |
|------|------|------|------|------|
| Rest | 静止，无眼睛 | — | 静止 | 纯 logo 场景（favicon、页脚） |
| Idle | 微摆 ±0.6° | 眨眼 + 漂移 | 缓慢呼吸 | 默认状态 |
| Talking | 掀起 1°-10° 铰链式 | 随说话微动 | 正常脉动 | 对话气泡出现时 |
| Thinking | 微摆 1.8° | 瞳孔看左上 | 缓慢上浮 | 加载/思考状态 |
| Happy | 大幅掀起 4°-8° + 弹跳 | 眯眼笑 | 快速弹跳 | 成功/结果展示 |
| Concerned | 微沉 | 眼睛缩小偏右 | 暗淡缓动 | 过敏原警告场景 |

**Landing Page 上的 Cloché 使用策略：**

每个 section 使用 Cloché 的**不同静态变体**（不是完整动画，而是取对应状态的关键帧做静态 SVG），形成贯穿全页的视觉线索：

| Section | Cloché 变体 | 含义 |
|---------|------------|------|
| Hero | Idle（动画，眨眼+微摆） | "嗨，我在这里" |
| Pain Points | Concerned（静态） | "这些问题我懂" |
| How It Works | Talking（静态，穹顶微掀） | "让我告诉你怎么做" |
| Features | 每个 feature 用不同变体图标 | 见下方详细设计 |
| Revenue Boost | Happy（静态，穹顶大开+弹跳帧） | "看！赚到了" |
| Pricing | Rest（静态，纯 logo） | 回归理性/专业 |
| Partners | Idle + 对话气泡 | "让我们聊聊合作" |
| Final CTA | Talking（动画） | "准备好了吗？" |

**Feature section 的 Cloché 变体图标（替代 lucide icon）：**

| Feature | 图标概念 |
|---------|---------|
| AI 提取 | Cloché 穹顶掀开，里面飞出文档碎片（菜品卡片） |
| 多语言/文化感知 | Cloché 旁边围绕多面小旗帜 |
| 过敏原合规 | Cloché + 盾牌，眼睛表情 concerned |
| 数据分析 | Cloché 穹顶上方浮现折线图 |

> **工程注意：** Landing Page 上只有 Hero 和 Final CTA 使用 CSS 动画的 Cloché。其余 section 全部用静态 SVG 关键帧，避免性能开销和视觉干扰。

---

## 三、页面结构（转化漏斗顺序）

### 总览

```
1. Navbar          — 导航 + CTA
2. Hero            — 一句话价值主张 + Cloché 动画 + 模拟 UI
3. Social Proof    — 信任锚点（数据/特性徽章）
4. Pain Points     — 共鸣（3 个真实痛点）
5. How It Works    — 理解（3 步上手）
6. Features        — 深度功能展示（4 个，带真实截图）
7. Revenue Boost   — 欲望（赚钱逻辑 + 数据）
8. Pricing         — 决策（3 档定价）
9. Use Cases       — 社会证明（3 个用户故事）
10. Coming Soon    — 期待感（WhatsApp Agent）
11. FAQ            — 消除疑虑（8 个问题）
12. Partners       — 合作伙伴/投资人专区 ← 新增
13. Final CTA      — 最后推动
14. Footer         — 收尾
```

vs 旧版变化：
- **删除** CompetitiveEdge（竞争对手对比表）
- **新增** Partners section
- **调整** Social Proof 文案（去掉竞争对手措辞）
- **调整** Feature 图片改用真实截图

---

## 四、每个 Section 的详细规范

### 1. Navbar

| 属性 | 值 |
|------|---|
| 目的 | 导航 + 转化入口 |
| 固定 | `position: fixed`，`backdrop-blur` |
| 左 | Logo (logo-icon.png) + "CarteAI" 文字 |
| 中 | Features / Pricing / FAQ 锚点链接（桌面端） |
| 右 | 语言切换 (FR/EN/中) + Sign in (文字) + Free trial (emerald 按钮) |
| 移动端 | 隐藏中间链接，保留语言切换 + CTA |

**不需要改动，当前实现已满足。**

---

### 2. Hero

| 属性 | 值 |
|------|---|
| 目的 | 5 秒内传递核心价值：AI 帮餐馆顾客点菜，提升客单价 |
| 布局 | 左文右图，`lg:grid-cols-2` |
| Cloché | Hero badge 里用小 Cloché（idle 静态），右侧模拟 UI 右上角用 Cloché（idle 动画，眨眼） |

**左侧内容：**
- Badge: `[Cloché icon] AI concierge for restaurants in Europe`
- H1: `你的顾客不知道点什么。` + `AI 知道。`（emerald 色）
- 副标题: 一句话解释产品 + 核心数据（19 语言、€2-5 增收）
- 双 CTA: 主按钮 "免费开始" + 次按钮 "了解工作原理"
- 4 个数据点: 19 语言 / 3s 推荐 / +€2-5 每桌 / €0 起步

**右侧模拟 UI：**
- 模拟手机屏幕，展示推荐流程：模式选择 → 最佳匹配结果
- 右上角放 Cloché（idle 动画），替代当前的 `ClocheIcon`
- 推荐卡片内也放一个小 Cloché（happy 静态）

**文案调性：** 直接、有力、数据驱动。不用"革命性""颠覆性"这类词。

---

### 3. Social Proof

| 属性 | 值 |
|------|---|
| 目的 | 快速建立信任锚点 |
| 布局 | 水平横幅，4 个特性徽章 |
| 内容 | 19 种语言 / 14 种 EU 过敏原合规 / 任何格式 / 零注册零下载 |

**文案修改：**
- 标题从~~"零直接竞争对手"~~改为 `深受欧洲各地餐厅信赖`（已完成）
- 保持 4 个特性徽章不变

---

### 4. Pain Points

| 属性 | 值 |
|------|---|
| 目的 | 引发共鸣——"对，这就是我的问题" |
| 布局 | 3 列卡片 |
| Cloché | section 标题旁放一个 Concerned 静态 Cloché（小尺寸） |
| 交互 | hover 时卡片边框变红色调 |

**3 个痛点保持不变：**
1. 游客看不懂菜单（语言障碍）
2. 过敏原是法律噩梦（合规风险）
3. 客单价还可以更高（营收机会）

**每张卡片结构：** icon + 标题 + 1-2 句描述（含具体数据，如"60% 的法国游客不会法语"）

---

### 5. How It Works

| 属性 | 值 |
|------|---|
| 目的 | 让老板觉得"这很简单，我也能用" |
| 布局 | 3 列，步骤间有连接线 |
| Cloché | 步骤编号旁用 Cloché 的 Talking 变体（穹顶微掀，像在讲解） |

**3 步不变：**
1. 上传菜单 (PDF/照片/CSV)
2. 打印 QR 码
3. 顾客点餐更好

**关键信息：** "5 分钟上手，不换收银系统"

---

### 6. Features（核心差异化展示）

| 属性 | 值 |
|------|---|
| 目的 | 深度展示 4 个核心功能，用真实截图证明产品成熟度 |
| 布局 | 左右交替排列（文字+截图） |
| 图片 | **必须用真实产品截图**，不用 AI 生成图 |

**4 个 Feature：**

| # | Tag | 标题 | 截图来源 | Cloché 变体 |
|---|-----|------|---------|------------|
| 1 | AI 提取 | 上传菜单，AI 搞定一切 | `/admin/{slug}/menu` 导入流程截图 | 穹顶掀开+文档飞出 |
| 2 | 文化感知 | 两种模式，两种体验 | `/r/{slug}` 双手机对比（英文 vs 中文） | Cloché + 多语言旗帜 |
| 3 | 过敏原合规 | 14 种 EU 过敏原，零猜测 | `/r/{slug}` 过敏原筛选界面截图 | Cloché + 盾牌 (concerned) |
| 4 | 数据分析 | 了解顾客真正想要什么 | `/admin/{slug}/analytics` 仪表板截图 | Cloché + 折线图浮现 |

**每个 Feature 结构：**
- Tag 徽章（emerald 小标签）
- H3 标题
- 描述段落（2-3 句）
- 4 个 bullet points（✓ 前缀）
- 右侧/左侧截图（圆角容器 + 微光边框）

**截图规范：**
- 桌面端截图：1600×1200，暗色容器内展示
- 手机端截图：Chrome DevTools responsive mode (iPhone 14 Pro 尺寸)
- 套 mockup 框（推荐 shots.so 或 Figma device frame）
- 背景与页面一致（深色 + emerald 微光）

---

### 7. Revenue Boost

| 属性 | 值 |
|------|---|
| 目的 | 激发欲望——"我可以多赚钱" |
| 布局 | 大卡片，左文右数据网格 |
| Cloché | Happy 变体（穹顶大开，弹跳帧），放在 section 标题旁 |

**核心信息：** `marginPriority` 功能隐性推荐高利润菜品，顾客无感，老板看到利润增长。

**数据网格 (2×2)：**
- +€2-5 每桌平均
- 30% 推荐为高利润菜品
- 0 顾客摩擦
- 100% 对你透明

---

### 8. Pricing

| 属性 | 值 |
|------|---|
| 目的 | 决策——"价格合理，我试试" |
| 布局 | 3 列定价卡 |
| Cloché | Rest 变体（纯 logo 剪影，无眼睛），放在 section 标题旁。回归理性/专业。 |
| 高亮 | Pro 卡片高亮（emerald 边框 + "Popular" 标签） |

**3 档不变：**

| 档位 | 价格 | 定位 |
|------|------|------|
| Starter | €19/月 | 数字化菜单基础功能 |
| Pro | €39/月 | 想要提升转化的餐厅 |
| Enterprise | 定制 | 多门店、白标、API |

**所有档位 CTA：** "14 天免费试用"（Starter/Pro）/ "联系我们"（Enterprise）

---

### 9. Use Cases

| 属性 | 值 |
|------|---|
| 目的 | 社会证明——"别人已经在用了" |
| 布局 | 3 列卡片 |
| 内容 | 3 个虚构但真实感的用户故事 |

**3 个角色不变：**
1. Marco — 美国游客在巴黎（对应 Journey 1）
2. 小张 — 中国人组菜聚餐（对应 Journey 2）
3. Dupont 太太 — 蒙马特小酒馆老板（对应 Journey 3）

**注意：** 这些是来自 PRD 的 User Journeys，而非真实用户评价。可以保持当前的引号+斜体格式，但不要标注为 "testimonial"。标注为 "Use Cases"（使用场景）更诚实。

---

### 10. Coming Soon

| 属性 | 值 |
|------|---|
| 目的 | 传递产品有路线图、在持续迭代 |
| 布局 | 单个大卡片 |
| 内容 | WhatsApp Agent — "给 bot 发消息就能管菜单" |

---

### 11. FAQ

| 属性 | 值 |
|------|---|
| 目的 | 消除最后的疑虑 |
| 布局 | 手风琴折叠 |
| 数量 | 8 个问题 |

**保持当前 8 个 FAQ 不变。**

---

### 12. Partners（新增）

| 属性 | 值 |
|------|---|
| 目的 | 给投资人/合作伙伴一个着陆点，展示商业潜力 |
| 布局 | 深色大卡片，左文右 Cloché（idle 动画 + 对话气泡） |
| 锚点 | `#partners` |
| 可见性 | 页面中自然出现（在 FAQ 之后、Final CTA 之前），不隐藏 |

**内容结构：**

```
标签: "For Partners"
标题: "一起重新定义餐桌体验"
副标题: "CarteAI 正在寻找战略合作伙伴，共同开拓欧洲智能餐饮市场"
```

**3 个合作方向卡片：**

| 卡片 | 图标 | 标题 | 描述 |
|------|------|------|------|
| 餐饮集团 | 🏢 Building | 连锁/集团部署 | "10+ 家门店？我们提供企业版白标方案，统一管理多店菜单、数据和品牌。定制 API 对接你的 POS/CRM。" |
| 技术合作 | 🔗 Link | 技术集成 | "POS 系统、预订平台、支付方案？CarteAI 的推荐层可作为 API 嵌入你的产品，为你的用户增加 AI 点餐能力。" |
| 投资人 | 📈 TrendingUp | 投资机会 | "欧洲 AI 餐饮推荐赛道的先行者。LLM 成本下降 + 后疫情 QR 普及 = 窗口期。我们正在寻找理解 B2B2C SaaS 的早期投资者。" |

**每张卡片底部 CTA：** `联系我们 → contact@carte-ai.link`

**右侧 Cloché：**
- Idle 动画（眨眼 + 微摆）
- 对话气泡: `"Let's build something together."`（多语言轮换）

**关键数据展示（小字，卡片下方）：**

| 数据点 | 值 |
|--------|---|
| 目标市场 | 欧洲 200 万+ 独立餐馆 |
| 当前阶段 | POC → 付费验证 |
| 技术栈 | Next.js + Vercel + 双层 AI 引擎 |
| 合规 | GDPR + EU 1169/2011 过敏原 |

---

### 13. Final CTA

| 属性 | 值 |
|------|---|
| 目的 | 最后推动注册 |
| 布局 | 居中大卡片，emerald 发光边框 |
| Cloché | Talking 动画（穹顶掀开，像在说最后一句话邀请你） |

**内容：**
- H2: "准备好提升订单了吗？"
- 副标题: "14 天免费试用，无需信用卡。"
- 双 CTA: "创建我的 AI 菜单" + "联系我们"

---

### 14. Footer

| 属性 | 值 |
|------|---|
| 4 列 | CarteAI 简介 / 产品链接 / 法律链接 / 联系方式 |
| Cloché | Rest 变体（纯 logo，无眼睛） |
| 新增 | Partners 锚点链接加入产品列 |

---

## 五、i18n 新增 Keys

### Partners Section

需要在 `landing-i18n.ts` 新增以下 keys：

```
partners_section: "For Partners" / "Partenaires" / "合作伙伴"
partners_title: "一起重新定义餐桌体验" (+ en/fr)
partners_subtitle: "CarteAI 正在寻找战略合作伙伴..." (+ en/fr)

partners_enterprise_title: "连锁/集团部署" (+ en/fr)
partners_enterprise_desc: "10+ 家门店？..." (+ en/fr)

partners_tech_title: "技术集成" (+ en/fr)
partners_tech_desc: "POS 系统、预订平台..." (+ en/fr)

partners_invest_title: "投资机会" (+ en/fr)
partners_invest_desc: "欧洲 AI 餐饮推荐赛道..." (+ en/fr)

partners_cta: "联系我们" (+ en/fr)
partners_market: "200万+ 欧洲独立餐馆" (+ en/fr)
partners_stage: "POC → 付费验证" (+ en/fr)
partners_stack: "Next.js + Vercel + 双层 AI" (+ en/fr)
partners_compliance: "GDPR + EU 1169/2011" (+ en/fr)
```

---

## 六、SEO 与元数据

| 属性 | 值 |
|------|---|
| `<title>` | "CarteAI — AI 点餐顾问 · 19 种语言智能 QR 菜单" |
| `meta description` | "帮助餐厅用 AI 推荐菜品，19 种语言覆盖国际游客，14 种过敏原合规，每桌多赚 €2-5。免费试用。" |
| OG Image | 当前 `opengraph-image.png` 需更新为含 Cloché 形象的版本 |
| 结构化数据 | `SoftwareApplication` schema（name, offers, applicationCategory） |

---

## 七、性能预算

| 指标 | 目标 |
|------|------|
| LCP | ≤2.5s |
| FID | ≤100ms |
| CLS | ≤0.1 |
| 首屏 JS | ≤80KB (gzipped) |
| 图片总大小 | ≤400KB（4 张截图 + logo） |
| Cloché SVG | 内联，≤5KB per 变体 |
| 动画 Cloché | 仅 Hero + Final CTA 两处使用 CSS animation |

---

## 八、实施优先级

| 优先级 | 任务 | 工作量 |
|--------|------|--------|
| P0 | 替换 Hero 的 ClocheIcon 为完整 Cloché SVG（idle 动画） | 中 |
| P0 | 删除 CompetitiveEdge（已完成） | ✅ |
| P0 | 更新 Social Proof 文案（已完成） | ✅ |
| P1 | 新增 Partners section + i18n | 中 |
| P1 | 替换 Feature 图片为真实截图 | 需截图 |
| P1 | 为每个 section 添加 Cloché 静态变体图标 | 中 |
| P2 | Final CTA 添加 Talking 动画 Cloché | 小 |
| P2 | OG Image 更新 | 小 |
| P2 | SEO 结构化数据 | 小 |

---

## 九、验证清单

- [ ] 全页从上到下阅读，每个 section 只传递一个核心信息
- [ ] Cloché 在每个 section 出现但不喧宾夺主（视觉辅助，非主角）
- [ ] 三语（FR/EN/ZH）切换后文案完整、排版正常
- [ ] Partners section 的 contact 链接可用
- [ ] Feature 截图清晰、与实际产品一致
- [ ] 移动端（375px）每个 section 布局正常
- [ ] Lighthouse Performance ≥90
- [ ] 注册按钮从任何 section 都能在 1 次点击内触达
