# 开发指南

## 前置条件

| 项 | 版本 | 验证 |
|---|------|------|
| Node.js | ≥ 20（实测 24.4 OK） | `node --version` |
| npm | 随 Node | `npm --version` |
| Git | — | — |

## 安装与启动

```bash
git clone <repo>
cd carte-ai
npm install

# 复制环境变量模板，按需填值
cp .env.local.example .env.local

# 本地开发
npm run dev
```

打开：

- http://localhost:3001 —— 产品落地页
- http://localhost:3001/demo —— 顾客 QR 体验
- http://localhost:3001/admin —— 老板后台
- http://localhost:3001/poster —— 可打印海报

## 环境变量

| 变量 | 必填 | 默认 / 示例 | 用途 |
|------|------|-----------|------|
| `OPENAI_API_KEY` | 否 | — | OpenAI 文本 LLM。**未配时回退本地规则**，应用仍可用 |
| `OPENAI_MODEL` | 否 | `gpt-4.1-mini` | OpenAI 模型 |
| `GEMINI_API_KEY` | 否 | — | Google Gemini Vision（菜单 OCR） |
| `GOOGLE_MAPS_API_KEY` | 否 | — | Google Places v1。**未配时**老板端搜索餐馆会提示但不报错 |
| `NEXT_PUBLIC_APP_NAME` | 否 | `CarteAI` | 客户端可读 |
| `NEXT_PUBLIC_APP_URL` | 否 | `https://carte-ai.link` | 客户端可读 |

**LLM 优先级**：OpenAI（文本推荐/结构化） + Gemini（Vision OCR） → 本地规则。失败自动降级。

## 命令速查

| 命令 | 作用 |
|------|------|
| `npm run dev` | 本地开发（Next.js dev server，含 HMR） |
| `npm run build` | 产物构建（`.next/`） |
| `npm run start` | 启动构建产物 |
| `npm run lint` | ESLint（`eslint-config-next`） |

无 `test` 脚本：仓库装了 `playwright` 但**没有任何测试文件**。

## 项目约定

### 路径别名

```jsonc
// tsconfig.json
"paths": { "@/*": ["./src/*"] }
```

约定：库代码用 `@/lib/...`，类型用 `@/types/...`，组件用 `@/components/...`。

### 类型与校验双层约束

凡是跨边界的数据（API body、`localStorage`、文件上传），**类型 + Zod schema 都要写**。Zod schema 是运行时真相，类型是开发时辅助。

### LocalizedText 三语必填

任何菜品 / 餐馆字段的多语言版本**必须包含 `zh` / `fr` / `en`**，其余 17 种语言可选。Zod 在 parse 时会校验。

### LLM 安全护栏

LLM 调用必须遵循（已在 `lib/llm.ts` system prompt 写死）：

1. **只能从 candidates 列表挑** —— 不准发明菜品
2. **不准编造价格 / 过敏原 / 卡路里**
3. **过敏数据缺失时必须提示用户找服务员核对**
4. **输出严格 JSON**

新增 LLM 调用时不要复制 system prompt，直接复用 `recommendWithLlm` / `extractMenuDraftWithLlm`。

### 永不阻塞用户

业务路径上的失败必须降级 —— 例如 `/api/recommend` 任何外部失败都返回本地规则结果。新写 endpoint 时遵循同样原则。

## 调试技巧

- **强制走本地规则**：暂时注释 `.env.local` 里的 LLM keys
- **观察 LLM 决策**：响应里 `provider` 字段直接显示用了哪条路径
- **菜单覆盖**：在浏览器 DevTools `Application > LocalStorage > carteai.menu` 直接编辑 JSON

## 部署

当前部署：**Vercel**（`devDependencies` 中已加入 `vercel` CLI）。

- 直接推 main 分支触发部署
- 环境变量在 Vercel Dashboard `Settings > Environment Variables` 配
- `next.config.ts` 当前只配了 `allowedDevOrigins: ["192.168.1.103"]`（局域网手机调试用），**生产无影响**

无 Dockerfile / k8s / CI workflow（`.github/` 不存在）。

## 待补强（开发体验）

| 项 | 优先级 | 说明 |
|---|-------|------|
| 添加 Playwright E2E 测试 | 高 | 推荐主链路 + 老板上传链路至少各 1 条 |
| 添加 Vitest 单测 | 中 | `lib/recommender.ts` 是纯函数，最适合开始 |
| GitHub Actions CI | 中 | lint + build + 测试 + Vercel preview |
| `app/error.tsx` + `app/not-found.tsx` | 低 | 当前依赖默认 fallback |
| OpenAPI / API 类型导出 | 低 | 前后端类型已共享，但外部消费者尚无 |
