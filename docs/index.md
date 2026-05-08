# CarteAI 项目文档索引

> 由 BMAD `bmad-document-project` 生成 · 2026-05-04 · Deep Scan

## 项目概要

- **类型**：Monolith Next.js 16 全栈应用（Brownfield）
- **主语言**：TypeScript 5
- **架构模式**：App Router 全栈（Server Components + Route Handlers + Client Components）
- **形态**：单租户 MVP / 已部署 Vercel / 已接 LLM

## 速查参考

| 维度 | 当前状态 |
|------|---------|
| 入口 | `src/app/page.tsx` （`/`、`/demo`、`/admin`、`/poster`） |
| 业务核心 | `src/lib/recommender.ts` + `src/lib/llm.ts` |
| 数据 | `data/menu.json`（静态） + `localStorage`（运行时） |
| LLM | Anthropic Foundry（主） + OpenAI（兜底） + 本地规则（终极降级） |
| 多语言 | 20 语言 + RTL |
| 测试 | ❌ 零（playwright 已装未用） |
| CI | ❌ 无 |
| 数据库 | ❌ 无 |
| 鉴权 | ❌ 无 |

## 生成的文档

- [项目总览](./project-overview.md) —— 产品定位 / 技术栈 / "差点啥"清单
- [架构文档](./architecture.md) —— 当前真实架构、推荐引擎设计、风险债务
- [源码树注解](./source-tree-analysis.md) —— 入口 / 关键目录 / 集成图
- [API 契约](./api-contracts.md) —— 5 个 endpoint 完整契约
- [数据模型](./data-models.md) —— 类型契约 + localStorage 键 + 未来 DB 草案
- [UI 组件清单](./component-inventory.md) —— 2 个客户端组件 + 设计 token 提取
- [开发指南](./development-guide.md) —— 安装 / 环境变量 / 命令 / 部署
- [扫描状态](./project-scan-report.json) —— BMAD 工作流断点续跑

## 项目自带文档

- [README.md](../README.md) —— 安装 + API 速览 + AI 提供商
- [DESIGN.md](../DESIGN.md) —— 视觉设计语言（深色 + emerald/cyan + AI Concierge）
- [CLAUDE.md](../CLAUDE.md) → [AGENTS.md](../AGENTS.md) ⚠️ 仍是占位

## 上手路径

1. 先看 [项目总览](./project-overview.md) —— 产品和技术全景
2. 再看 [架构文档](./architecture.md) §6 推荐引擎设计 —— 这是核心业务逻辑
3. [源码树注解](./source-tree-analysis.md) —— 上手改代码前的导航
4. [开发指南](./development-guide.md) —— 跑起来 + 环境变量

## BMAD 下一步

本次 brownfield 文档化已完成。建议接续：

| 步骤 | 命令 | 目的 |
|------|------|------|
| 项目简报 | `bmad-product-brief` | 愿景、目标用户、商业模型、MVP 边界 |
| PRD | `bmad-create-prd` | FR/NFR + Epics + Stories |
| UX 设计 | `bmad-create-ux-design` | 信息架构、用户旅程 |
| 架构设计 | `bmad-create-architecture` | 持久化 / 多租户 / 鉴权 决策 |
| Epic & Story | `bmad-create-epics-and-stories` | 拆成可执行故事 |
| 文档分片 | `bmad-shard-doc` | 切成 Dev 可消费的小文件 |
| 实现就绪检查 | `bmad-check-implementation-readiness` | PRD/UX/Arch/Epics 一致性校验 |

> 💡 准备进入 PRD 阶段时，把本 `index.md` 作为输入提供给 PRD 工作流，让 PM 在 brownfield 真实基线上做需求规划。
