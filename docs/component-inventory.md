# UI 组件清单

> 项目目前**只有 2 个客户端组件**，其余皆为 Server Components 直接组合 lucide 图标和 Tailwind utility classes。无设计系统库（如 shadcn/ui、Radix）。

## 概览

| 类别 | 组件数 | 文件位置 |
|------|--------|---------|
| 客户端交互组件 | 2 | `src/components/` |
| Server Component 页面 | 4 | `src/app/{,demo,admin,poster}/page.tsx` |
| 设计系统 | ❌ 无 | 直接 Tailwind utility |
| 第三方 UI lib | lucide-react（仅图标） | — |

---

## 客户端组件

### 1. `DemoExperience` —— 顾客 QR 体验主交互

**文件**：`src/components/DemoExperience.tsx`（507 行）

**Props**：

```ts
{ initialMenu: RestaurantMenu }    // SSR 注入的默认菜单
```

**职责**：

- 多语言切换（19 种，含 RTL 自动 `dir="rtl"`）
- 6 种限制 chip（不辣 / 素 / 不吃牛肉 / 不吃海鲜 / 无奶 / 麸质敏感）
- 5 种推荐模式按钮（首次 / ≤10€ / 招牌 / 健康 / 分享）
- 自由文本输入 + Web Speech API 语音输入
- 调 `/api/recommend` 渲染 AI 推荐卡（理由 / 价格 / 过敏原 / 信心）
- 启动时从 `localStorage` 读取菜单覆盖与上次语言

**核心 state**：

```ts
menu, language, mode, budgetCents, partySize, selectedRestrictions[],
userText, response: RecommendationResponse | null, loading, listening, error
```

**视觉风格**（与 DESIGN.md 对齐）：

- `bg-[#050507]` 近黑底 + `bg-emerald-400/20 blur-3xl` 顶部光晕
- 中央 AI Concierge 球（`BrainCircuit` + `ScanLine` + 双层环 + 脉冲光）
- 推荐卡用 `border-emerald-200/20` + `bg-emerald-200/10` 玻璃感

### 2. `AdminStudio` —— 老板后台

**文件**：`src/components/AdminStudio.tsx`（443 行）

**Props**：

```ts
{ initialMenu: RestaurantMenu }
```

**功能区**：

| 区块 | 功能 |
|------|------|
| Stats | 菜品数 / 语言数 / 平均价 |
| Find restaurant on Google | 调 `/api/google/places/search` + `/details`，更新 restaurant identity |
| Upload menu | 调 `/api/ingest` → 渲染 AI 草稿到 JSON 编辑器 |
| Menu JSON editor | textarea + Parse + Publish 按钮 |
| Preview | 实时显示菜品列表（中/法/英 三语） |
| Quick links | `/demo` 预览 + `/poster` 海报 |

**核心 state**：

```ts
menuJson (string), preview: RestaurantMenu, message, error, uploading,
placeQuery, placeSearching, placeCandidates: PlaceCandidate[],
selectedPlace: PlaceCandidate | null
```

**关键交互**：

- `parseJson()` 校验后更新 preview
- `publishLocal()` 写 `localStorage.carteai.menu`
- `selectPlace()` 用 Google 数据自动改写 restaurant.id/slug/name/city

---

## Server Component 页面

### 3. `app/page.tsx` —— 产品落地页

落地页 Hero 块 + 模拟 QR 预览面板 + 三个 Feature 卡片。无客户端交互（全静态）。

### 4. `app/demo/page.tsx` & `app/admin/page.tsx`

各 6 行的 thin wrapper，加载 `getDefaultMenu()` 并把 `RestaurantMenu` 作为 prop 传给客户端组件。

### 5. `app/poster/page.tsx` —— 可打印海报

**async Server Component**，编译时调 `qrcode.toDataURL()` 生成 dataURL，嵌到 `<Image unoptimized>`。包含 print：hidden 类，用浏览器原生打印即可输出。

QR 内容固定指向 `https://carte-ai.link/r/${slug}` —— **该路由暂未实现**。

---

## 设计 token 一览（提取自 Tailwind utility 实际使用）

| 用途 | Token |
|------|-------|
| 顾客端底色 | `bg-[#050507]` |
| 老板端底色 | `bg-[#08090c]` |
| 海报底色 | `bg-[#0b0c10]` |
| 主品牌色 | `bg-emerald-300` / `text-emerald-200` |
| 强调色 | `bg-cyan-200` / `text-cyan-100` |
| 中性玻璃面 | `bg-white/[0.04]` + `border-white/10` |
| 边框柔和 | `border-emerald-200/20` |
| 光晕 | `blur-3xl` + `bg-emerald-400/20` |
| 字体 | Geist Sans / Geist Mono（layout.tsx 默认） |

---

## 缺失 / 改进建议

| 项 | 说明 |
|---|------|
| 没有设计系统抽象 | 所有按钮 / 卡片 / 输入框样式 inline。下一阶段建议引入 **shadcn/ui**（Radix 底）或自建 `<Button>` `<Card>` `<ChipToggle>` |
| 没有 Loading skeleton | 推荐 / 上传过程仅用 `Loader2` 旋转 |
| 没有 Error boundary | `app/error.tsx` 不存在 |
| 没有 Toast | message / error 直接渲染在卡片下方文字 |
| 没有 a11y 测试 | 键盘 Tab 流程未验证；RTL 已支持但未在 19 种语言下回归 |
| 老板端 textarea 编辑菜单 JSON | UX 差。下一阶段改为表格化菜品编辑器 |
| 海报字体过大且不可定制 | 当前固定 6xl 标题，多语言溢出风险 |
