# Walle（瓦力）

一个基于 Next.js 14 的静态博客系统，专注于**极简配置、主题自由和开箱即用**。

---

## 特性

- **零依赖配置** — 使用 TypeScript 原生配置文件，类型安全，无需 YAML 解析器
- **运行时主题切换** — 基于 `next/dynamic` 的主题覆盖机制，自定义主题只需编写差异化组件
- **Markdown 优先** — `gray-matter` 解析 Frontmatter，`remark` + `rehype-highlight` 渲染内容与代码高亮
- **图片支持** — 统一图片目录 `content/assets/`，编辑器预览与构建发布均可用，自动处理 basePath
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

# 手动同步搜索索引和图片资源（dev 模式不自动执行）
npm run prebuild

# 构建（自动执行 prebuild）
npm run build
```

## 项目结构

```text
Walle/
├── app/                                  # Next.js App Router 页面
│   ├── layout.tsx                        # 全局布局（Navbar + 字体 + 样式）
│   ├── globals.css                       # CSS 变量 + 全局样式
│   ├── page.tsx                          # 首页（文章列表第 1 页）
│   ├── archives/page.tsx                 # 归档页
│   ├── posts/
│   │   ├── [slug]/page.tsx               # 文章详情
│   │   └── page/[page]/page.tsx          # 文章分页
│   ├── categories/
│   │   ├── page.tsx                      # 分类列表
│   │   └── [category]/...               # 分类文章（含分页）
│   └── tags/
│       ├── page.tsx                      # 标签列表
│       └── [tag]/...                     # 标签文章（含分页）
├── src/
│   ├── core/
│   │   ├── config.ts                     # 全局配置（标题、作者、主题、功能开关）
│   │   ├── ThemeResolver.tsx             # 运行时主题加载器
│   │   ├── lib/posts.ts                  # 文章解析、图片路径处理、数据访问层
│   │   └── types/index.ts               # 所有共用 TypeScript 类型
│   └── themes/
│       ├── base/                         # 默认主题（完整组件实现）
│       └── <your-theme>/                 # 自定义主题（仅需差异化组件）
├── content/
│   ├── posts/                            # Markdown 文章（平铺，不含子目录）
│   └── assets/                           # 文章图片（支持子目录）
├── public/
│   ├── assets/                           # 构建时由 content/assets/ 自动同步
│   └── search-index.json                 # 构建时自动生成
├── scripts/
│   └── build-search-index.ts             # 搜索索引生成 + 图片资源同步
├── doc/Develop.md                        # 开发文档（实现细节、技术决策）
├── .claude/plans/                        # 功能计划文档（YYYYMMDD-功能名-Plan.md）
├── next.config.mjs                       # Next.js 配置（SSG + basePath）
└── .github/workflows/deploy.yml         # GitHub Pages 自动部署
```

## 编写文章

在 `content/posts/` 下创建 `.md` 文件，支持以下 Frontmatter 字段：

```markdown
---
title: 文章标题
date: 2026-03-23
summary: 文章摘要（可选，未填写则取正文前 200 字）
category: 技术
tags: [tag1, tag2]
---

正文内容...
```

> `date` 字段缺失时，自动回退到文件修改时间（mtime）。

## 插入图片

将图片放入 `content/assets/`（支持子目录），在 Markdown 中使用相对路径引用：

```markdown
![图片说明](../assets/image.png)
![图片说明](../assets/2026/image.png)
```

- 编辑器（VS Code、Typora、Obsidian 等）预览直接可用
- `npm run build` 时自动同步到 `public/assets/` 并处理 basePath
- 本地开发新增图片后需先执行 `npm run prebuild`

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
| `.claude/plans/` | 分阶段 AI 执行计划文档（YYYYMMDD-功能名-Plan.md），每个 Phase 包含可直接使用的指令块与验收标准 |
| `.claude/plans/statics blog technical plan.md` | 系统技术方案原始设计文档，记录架构设计思路与可行性分析 |

## 许可证

[MIT License](./LICENSE) © 2026 flcker
