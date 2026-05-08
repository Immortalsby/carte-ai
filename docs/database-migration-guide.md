# 数据库迁移指南

> 本文档是 CarteAI 数据库变更的唯一标准流程。任何 schema 变更（新增列、改类型、加索引等）都**必须**走本流程，禁止手动执行 SQL 或直接 `db:push`。

## 基础设施

| 项 | 值 |
|---|---|
| 数据库 | Neon PostgreSQL (Serverless) |
| ORM | Drizzle ORM (`drizzle-orm` + `drizzle-kit`) |
| Schema 文件 | `src/lib/db/schema.ts`（业务表）、`src/lib/db/auth-schema.ts`（认证表） |
| Migration 目录 | `drizzle/migrations/` |
| 配置文件 | `drizzle.config.ts`（读 `.env.local` 的 `DATABASE_URL`） |

## Neon 分支策略

| 环境 | Neon 分支 | Pooler 端点 | Unpooled 端点 |
|---|---|---|---|
| **生产** | `main` | `ep-small-smoke-amzlzz7m-pooler` | `ep-small-smoke-amzlzz7m` |
| **开发/测试** | `dev` | `ep-royal-recipe-am8ilzo9-pooler` | `ep-royal-recipe-am8ilzo9` |

### `.env.local` 配置

```env
# dev 分支（pooler，日常开发用）
DATABASE_URL="postgresql://...@ep-royal-recipe-am8ilzo9-pooler.../neondb?..."

# main 分支（unpooled，用于生产迁移）
DATABASE_URL_UNPOOLED="postgresql://...@ep-small-smoke-amzlzz7m.../neondb?..."
```

> **重要**：`drizzle.config.ts` 优先使用 `DATABASE_URL_UNPOOLED`。Pooler 连接会导致 `db:migrate` 卡死，迁移**必须**走 unpooled 连接。

**原则**：dev 分支先迁移验证，确认无误后再迁移 main 分支。两个分支的 schema 必须保持一致。

## 标准迁移流程

### 第 1 步：修改 Schema

在 `src/lib/db/schema.ts` 或 `src/lib/db/auth-schema.ts` 中修改表定义。

```ts
// 示例：给 tenants 表加一列
export const tenants = pgTable("tenants", {
  // ...existing columns...
  new_column: text("new_column"),  // <-- 新增
});
```

### 第 2 步：生成 Migration 文件

```bash
npm run db:generate
```

这会在 `drizzle/migrations/` 下生成一个新的 `.sql` 文件（如 `0003_xxx.sql`）和更新 `meta/_journal.json`。

**必须检查**：
- 打开生成的 `.sql` 文件，确认 SQL 语句是你期望的变更
- 确认没有 `DROP` 语句（除非你确实要删除）
- 确认没有意外的 `ALTER` 语句

### 第 3 步：在 dev 分支上迁移

`.env.local` 中 `DATABASE_URL` 默认指向 dev 分支。由于 pooler 不支持迁移事务，需要临时设置 dev 的 unpooled URL：

```bash
# 临时设置 dev unpooled URL 执行迁移
DATABASE_URL_UNPOOLED="postgresql://...@ep-royal-recipe-am8ilzo9.../neondb?sslmode=require" npm run db:migrate

# 或者：在 .env.local 中临时将 DATABASE_URL_UNPOOLED 改为 dev unpooled URL
```

### 第 4 步：验证 dev 环境

```bash
# 启动本地开发服务器
npm run dev

# 验证：
# 1. 页面正常加载，无 500 错误
# 2. 涉及变更表的功能正常工作
# 3. 检查 Drizzle Studio 确认表结构正确
npm run db:studio
```

### 第 5 步：在 main 分支上迁移（生产）

确保 `.env.local` 中 `DATABASE_URL_UNPOOLED` 指向 main 分支（`ep-small-smoke-amzlzz7m`），然后执行：

```bash
npm run db:migrate
```

> `drizzle.config.ts` 自动优先使用 `DATABASE_URL_UNPOOLED`，无需手动切换。

### 第 6 步：提交并部署

```bash
# 提交 migration 文件
git add drizzle/migrations/
git add src/lib/db/schema.ts src/lib/db/auth-schema.ts
git commit -m "migration: 描述变更内容"
git push origin main
```

### 第 7 步：验证生产环境

```bash
# 检查 Vercel 部署状态
npx vercel ls

# 检查生产日志是否有数据库错误
npx vercel logs --level error --since 10m --no-follow
```

## 命令速查

| 命令 | 作用 | 何时使用 |
|---|---|---|
| `npm run db:generate` | 根据 schema diff 生成 migration SQL | schema 修改后 |
| `npm run db:migrate` | 执行未应用的 migration | dev/main 各执行一次 |
| `npm run db:push` | **禁止使用** — 直接推 schema，不生成 migration 文件 | ~~仅紧急修复~~ 不使用 |
| `npm run db:studio` | 打开 Drizzle Studio 可视化查看数据库 | 验证表结构 |

## 注意事项

### 禁止事项

- **禁止** 使用 `db:push` — 它不生成 migration 文件，无法追踪和回滚
- **禁止** 手动在 Neon Console 执行 SQL — 会导致 migration 状态不一致
- **禁止** 修改已提交的 migration 文件 — 已执行的 migration 不可变更
- **禁止** 在未验证 dev 的情况下直接迁移 main

### 破坏性变更

以下操作需要**特别谨慎**，必须在 dev 上充分测试：

| 操作 | 风险 | 处理方式 |
|---|---|---|
| 删除列 | 数据丢失 | 先确认代码不再引用该列，分两次部署（先删代码引用，再删列） |
| 重命名列 | 代码引用断裂 | 用「加新列 → 迁移数据 → 删旧列」三步走 |
| 改列类型 | 数据截断/转换失败 | 在 dev 上用真实数据量测试 |
| 加 NOT NULL | 现有数据违约 | 先加列（允许 null）→ 回填数据 → 再加 NOT NULL 约束 |
| 删除表 | 数据丢失 | 确认无外键引用，先备份 |

### 回滚策略

Drizzle 不提供自动回滚。如果迁移出错：

1. **手动编写反向 SQL**：创建新的 migration 文件，包含撤销操作
2. **Neon 分支恢复**：Neon 支持 Point-in-Time Recovery，可从控制台恢复到迁移前的时间点
3. **紧急修复**：如果生产已崩溃，可以直接在 Neon Console 执行反向 SQL，然后补一个对应的 migration 文件保持一致

### Schema 与代码同步检查清单

每次 schema 变更后，确认以下文件是否需要同步更新：

- [ ] `src/lib/db/schema.ts` — Drizzle 表定义
- [ ] `src/lib/db/queries/*.ts` — 涉及该表的查询函数
- [ ] Zod validation schemas — 如果有对应的 API 入参校验
- [ ] TypeScript 类型 — `Parameters<>` / `InferSelectModel<>` 等派生类型
- [ ] i18n 文件 — 如果新增了用户可见的枚举值
- [ ] `docs/data-models.md` — 数据模型文档

## Migration 文件命名

Drizzle Kit 自动生成文件名（如 `0003_random_name.sql`）。**不要手动重命名**，序号和 journal 必须对应。

## 紧急联系

如果生产数据库出现问题：

1. 检查 Vercel 日志：`npx vercel logs --level error --since 1h --no-follow`
2. 检查 Neon Console：https://console.neon.tech
3. 如需回滚，使用 Neon 的 Point-in-Time Recovery
