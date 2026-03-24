# Walle（瓦力）

一个基于 Next.js 14 的静态博客系统，专注于**极简配置、主题自由和开箱即用**。

---

## 特性

- **零依赖配置** — 使用 TypeScript 原生配置文件，类型安全，无需 YAML 解析器
- **运行时主题切换** — 基于 `next/dynamic` 的主题覆盖机制，自定义主题只需编写差异化组件
- **Markdown 优先** — `gray-matter` 解析 Frontmatter，`remark` + `rehype-highlight` 渲染内容与代码高亮
- **客户端搜索** — 构建时生成搜索索引，Fuse.js 驱动的模糊搜索，无需服务器
- **自动化部署** — GitHub Actions 一键发布至 GitHub Pages

## 技术栈

| 模块 | 工具 |
|:---|:---|
| 基础框架 | Next.js 14 (App Router, SSG) |
| 配置管理 | `src/core/config.ts` |
| 内容解析 | gray-matter + remark |
| 代码高亮 | rehype-highlight |
| 样式方案 | Tailwind CSS + CSS 变量 |
| 客户端搜索 | Fuse.js |
| 日期处理 | date-fns |

## 快速开始

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 构建（自动生成搜索索引）
npm run build
```

## 项目结构

```text
Walle/
├── src/
│   ├── core/
│   │   ├── config.ts         # 全局配置（标题、作者、主题、功能开关）
│   │   ├── ThemeResolver.tsx # 运行时主题加载器
│   │   ├── lib/
│   │   │   └── posts.ts      # 文章解析与归档逻辑
│   │   └── types/            # TypeScript 类型定义
│   ├── themes/
│   │   ├── base/             # 默认主题（完整组件实现）
│   │   └── <your-theme>/     # 自定义主题（仅需差异化组件）
│   └── app/                  # Next.js App Router 页面
├── content/
│   └── posts/                # Markdown 文章
├── public/
│   └── search-index.json     # 构建时自动生成
├── scripts/
│   └── build-search-index.ts # 搜索索引生成脚本
├── doc/
│   └── Develop.md            # 开发文档（实现细节、技术决策、部署方式）
├── plan/
│   ├── Plan.md               # AI 驱动的分阶段执行计划
│   └── statics blog technical plan.md  # 系统技术方案原始设计文档
└── .github/workflows/
    └── deploy.yml            # 自动部署脚本
```

## 编写文章

在 `content/posts/` 下创建 `.md` 文件，支持以下 Frontmatter 字段：

```markdown
---
title: 文章标题
date: 2026-03-23
summary: 文章摘要（可选，未填写则取正文前 200 字）
tags: [tag1, tag2]
---

正文内容...
```

> `date` 字段缺失时，自动回退到 Git 首次提交时间，最终兜底使用文件修改时间。

## 切换主题

修改 `src/core/config.ts` 中的 `theme` 字段：

```ts
export const siteConfig = {
  theme: 'my-theme',  // 指向 src/themes/my-theme/
  // ...
};
```

自定义主题只需在 `src/themes/my-theme/` 中放置需要覆盖的组件，其余自动继承 `base` 主题。

## 文档

| 文件 | 说明 |
|:---|:---|
| `doc/Develop.md` | 开发文档，包含完整实现步骤、关键技术决策记录和部署方式说明 |
| `plan/Plan.md` | 分阶段 AI 执行计划，每个 Phase 包含可直接使用的指令块与验收标准 |
| `plan/statics blog technical plan.md` | 系统技术方案原始设计文档，记录架构设计思路与可行性分析 |

## 许可证

MIT
