# Walle 开发文档

本文档记录 Walle 博客系统的完整实现细节、关键技术决策与部署方法，供后续开发维护参考。

---

## 目录

1. [项目结构](#1-项目结构)
2. [技术栈与依赖说明](#2-技术栈与依赖说明)
3. [实现步骤详解](#3-实现步骤详解)
   - [Phase 1 — 项目初始化与配置层](#phase-1--项目初始化与配置层)
   - [Phase 2 — 内容解析层](#phase-2--内容解析层)
   - [Phase 3 — 视图层：Base 主题](#phase-3--视图层base-主题)
   - [Phase 4 — 运行时主题解析器与路由](#phase-4--运行时主题解析器与路由)
   - [Phase 5 — 搜索功能](#phase-5--搜索功能)
   - [Phase 6 — 自动化部署](#phase-6--自动化部署)
4. [关键技术决策记录](#4-关键技术决策记录)
5. [自定义主题](#5-自定义主题)
6. [部署方式](#6-部署方式)

---

## 1. 项目结构

```text
Walle/
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions 自动部署
├── app/                          # Next.js App Router 页面层
│   ├── archives/
│   │   └── page.tsx              # 归档页
│   ├── posts/
│   │   ├── [slug]/
│   │   │   └── page.tsx          # 文章详情页（SSG）
│   │   └── page/
│   │       └── [page]/
│   │           └── page.tsx      # 分页页面（SSG）
│   ├── globals.css               # CSS 变量定义 + Tailwind 指令
│   ├── layout.tsx                # 全局 Layout（含 Navbar）
│   └── page.tsx                  # 首页
├── content/
│   └── posts/                    # Markdown 文章文件夹
├── public/
│   └── search-index.json         # 构建时自动生成，勿手动修改
├── scripts/
│   └── build-search-index.ts     # 搜索索引生成脚本（prebuild 钩子）
├── src/
│   ├── core/
│   │   ├── config.ts             # 全局配置（唯一配置入口）
│   │   ├── ThemeResolver.tsx     # 运行时主题加载器
│   │   ├── lib/
│   │   │   └── posts.ts          # 文章解析与数据函数
│   │   └── types/
│   │       └── index.ts          # 全局 TypeScript 类型定义
│   └── themes/
│       ├── base/                 # 默认主题（完整实现）
│       │   ├── ArchiveList.tsx
│       │   ├── Calendar.tsx
│       │   ├── Navbar.tsx
│       │   ├── NavbarClient.tsx  # 搜索按钮（Client Component）
│       │   ├── Pagination.tsx
│       │   ├── PostCard.tsx
│       │   └── SearchModal.tsx   # 搜索弹窗（Client Component）
│       └── <your-theme>/         # 自定义主题（仅放差异化组件）
├── next.config.mjs
├── tailwind.config.ts
└── package.json
```

---

## 2. 技术栈与依赖说明

### 生产依赖

| 包 | 版本 | 用途 |
|:---|:---|:---|
| `next` | 14.x | 框架核心，SSG 静态生成 |
| `react` / `react-dom` | 18.x | UI 渲染 |
| `gray-matter` | 4.x | 解析 Markdown Frontmatter |
| `remark` | 15.x | Markdown → mdast AST |
| `remark-rehype` | 11.x | mdast → hast（HTML AST） |
| `rehype` | 13.x | hast 处理管道 |
| `rehype-highlight` | 7.x | 代码块语法高亮（构建时静态生成） |
| `highlight.js` | 11.x | 代码高亮样式与语言支持 |
| `fuse.js` | 7.x | 客户端模糊搜索 |
| `date-fns` | 4.x | 日期格式化 |

### 开发依赖

| 包 | 用途 |
|:---|:---|
| `tsx` | 直接执行 TypeScript 脚本（prebuild 钩子） |
| `tailwindcss` | CSS 工具类框架 |
| `typescript` | 类型系统 |

> **注**：原计划使用 `rehype-shiki` 实现代码高亮，但其 `0.0.9` 版本依赖旧版 `shiki-languages` CJS 包，与现代 ESM 的 remark 15 不兼容，故替换为 `rehype-highlight`。

---

## 3. 实现步骤详解

### Phase 1 — 项目初始化与配置层

#### 1.1 Next.js 初始化

使用 `create-next-app@14` 初始化，选项：TypeScript、Tailwind CSS、App Router、`@/*` import alias。

初始化后立即修改 `next.config.mjs`：

```js
const nextConfig = {
  output: 'export',          // 启用静态导出
  images: { unoptimized: true }, // 静态导出不支持 Image Optimization
  // basePath 由 CI 环境变量注入，本地开发无需设置
  ...(process.env.NEXT_PUBLIC_BASE_PATH
    ? { basePath: process.env.NEXT_PUBLIC_BASE_PATH }
    : {}),
};
```

#### 1.2 配置文件 `src/core/config.ts`

使用 TypeScript 原生对象代替 YAML，优势：类型安全、IDE 补全、无额外依赖。

```ts
export const siteConfig = {
  title: 'Walle',
  description: '一个简洁的静态博客',
  author: 'Your Name',
  theme: 'base',        // 改此字段切换主题
  postsPerPage: 10,
  features: {
    search: true,       // 控制搜索功能入口
    calendar: true,     // 控制归档页日历
  },
} as const;

export type SiteConfig = typeof siteConfig;
```

`as const` 确保所有字段为字面量类型，`typeof` 自动推导 `SiteConfig`，无需手动维护类型。

#### 1.3 全局类型定义 `src/core/types/index.ts`

定义了 6 个类型：`Post`、`GroupedArchive`、`SearchIndexItem`，以及主题组件 Props 类型：`PostCardProps`、`ArchiveListProps`、`CalendarProps`、`PaginationProps`。

主题组件 Props 集中在此文件管理，`ThemeResolver.tsx` 的 `dynamic<T>()` 泛型直接引用，保证类型安全。

---

### Phase 2 — 内容解析层

核心文件：`src/core/lib/posts.ts`

#### Markdown 解析管道

```
.md 文件
  → gray-matter       提取 Frontmatter + 原始内容
  → remark()          解析为 Markdown AST
  → remark-rehype     转换为 HTML AST
  → rehype-highlight  代码块添加高亮 class（构建时静态，无运行时 JS）
  → rehype-stringify  序列化为 HTML 字符串
```

#### 日期优先级策略

```
resolvePostDate(frontmatterDate, filePath)
  1. Frontmatter date 字段（优先）
  2. 文件系统 mtime（兜底）
  [可选扩展] Git commit 时间（需 fetch-depth: 0，见 Phase 7.3）
```

#### 导出的五个函数

| 函数 | 说明 |
|:---|:---|
| `getAllPosts()` | 读取并解析所有文章，按日期降序 |
| `getPostBySlug(slug)` | 按 slug 查找单篇，不存在返回 `null` |
| `getGroupedArchives()` | 按年份分组，年份降序 |
| `getPaginatedPosts(page)` | 分页，读取 `siteConfig.postsPerPage` |

所有函数均为 `async`，仅在 Node.js 环境（构建时/Server Component）调用，不会打包进客户端 JS。

---

### Phase 3 — 视图层：Base 主题

#### CSS 变量系统

`app/globals.css` 定义 7 个语义变量，支持 `prefers-color-scheme` 自动切换：

| Tailwind 类 | CSS 变量 | 含义 |
|:---|:---|:---|
| `bg-background` | `--color-background` | 页面背景 |
| `bg-surface` | `--color-surface` | 卡片/面板背景 |
| `border-border` | `--color-border` | 边框 |
| `text-primary` | `--color-primary` | 主色（链接、高亮） |
| `text-secondary` | `--color-secondary` | 辅助色 |
| `text-text` | `--color-text` | 正文颜色 |
| `text-muted` | `--color-text-muted` | 次要文字（日期、标签） |

`tailwind.config.ts` 的 `content` 扫描范围包含 `./src/**/*.{ts,tsx}`，确保主题组件中的类名被正确收集。

代码高亮样式通过 `layout.tsx` 全局引入：

```ts
import "highlight.js/styles/github.css";
```

#### Base 主题组件

| 组件 | 类型 | 说明 |
|:---|:---|:---|
| `Navbar.tsx` | Server Component | 静态导航结构，包含 NavbarClient |
| `NavbarClient.tsx` | Client Component | 控制搜索弹窗开关状态 |
| `PostCard.tsx` | Server Component | 文章卡片 |
| `ArchiveList.tsx` | Server Component | 按年份分组的归档列表 |
| `Calendar.tsx` | Server Component | 月历，受 `features.calendar` 控制 |
| `Pagination.tsx` | Server Component | 翻页导航，仅一页时不渲染 |
| `SearchModal.tsx` | Client Component (`ssr: false`) | 搜索弹窗主体 |

---

### Phase 4 — 运行时主题解析器与路由

#### ThemeResolver 工作原理

`src/core/ThemeResolver.tsx` 使用 `next/dynamic` 实现运行时按需加载：

```
import(`../themes/${theme}/PostCard`)
  ├─ 成功 → 使用自定义主题组件
  └─ 失败（.catch）→ import('../themes/base/PostCard')
```

每个 Themed 组件都携带显式 Props 泛型，避免 `dynamic<T>` 类型退化为 `object`：

```ts
export const ThemedPostCard = dynamic<PostCardProps>(
  () => import(`../themes/${theme}/PostCard`)
       .catch(() => import("../themes/base/PostCard"))
);
```

> **注意**：`output: 'export'` 模式下，`next/dynamic` 的所有目标模块会在构建时被静态打包（而非真正的运行时按需加载）。切换主题需要重新构建，这是静态站点的固有限制。

#### 路由页面

| 路由 | 文件 | 生成方式 |
|:---|:---|:---|
| `/` | `app/page.tsx` | Static |
| `/archives` | `app/archives/page.tsx` | Static |
| `/posts/[slug]` | `app/posts/[slug]/page.tsx` | SSG（`generateStaticParams`） |
| `/posts/page/[page]` | `app/posts/page/[page]/page.tsx` | SSG（`generateStaticParams`） |

首页（`/`）等价于第 1 页；`/posts/page/1` 也会生成，但实际上两者内容相同。分页器的 `prevHref` 在 `current === 2` 时指向 `/`（而非 `/posts/page/1`），保持 URL 简洁。

---

### Phase 5 — 搜索功能

#### 搜索索引生成

`scripts/build-search-index.ts` 通过 `package.json` 的 `prebuild` 钩子自动执行：

```json
"prebuild": "tsx scripts/build-search-index.ts"
```

输出的 `public/search-index.json` 结构：

```json
[
  {
    "slug": "hello-walle",
    "title": "Hello Walle",
    "date": "2026-03-23T00:00:00.000Z",
    "tags": ["walle", "test"],
    "summary": "瓦力博客系统的第一篇文章。"
  }
]
```

#### SearchModal 实现细节

组件拆分为三层，遵循 Next.js Server/Client 组件边界：

```
Navbar.tsx (Server)
  └─ NavbarClient.tsx ("use client")
       └─ SearchModal.tsx ("use client", ssr: false)  ← 懒加载
```

Fuse.js 配置：

```ts
new Fuse(data, {
  keys: [
    { name: "title",   weight: 0.6 },
    { name: "summary", weight: 0.3 },
    { name: "tags",    weight: 0.1 },
  ],
  threshold: 0.4,   // 0 = 精确匹配，1 = 匹配任何内容
})
```

索引在首次打开搜索弹窗时懒加载，后续通过 `useRef` 缓存实例，不重复请求。键盘导航支持：`↑↓` 切换，`Enter` 跳转，`Esc` 关闭。

---

### Phase 6 — 自动化部署

#### Workflow 触发条件

```yaml
on:
  push:
    branches: [main]
```

推送到 `main` 分支时自动触发，包括 Markdown 文章的新增/修改。

#### 构建流程

```
checkout (fetch-depth: 0)
  → setup-node 20 + npm cache
  → npm ci
  → npm run build
       ├─ prebuild: tsx scripts/build-search-index.ts
       └─ next build → out/
  → upload-pages-artifact (out/)
  → deploy-pages
```

#### basePath 配置

博客部署到 GitHub Pages 时，若仓库名不是 `username.github.io`，页面路径会有前缀（如 `/walle/`）。处理方式：

1. 在仓库 **Settings → Secrets and variables → Actions → Variables** 中添加：
   ```
   NEXT_PUBLIC_BASE_PATH = /仓库名
   ```
2. Workflow 通过 `${{ vars.NEXT_PUBLIC_BASE_PATH }}` 注入构建环境
3. `next.config.mjs` 读取该变量并设置 `basePath`

本地开发不需要任何改动。

---

## 4. 关键技术决策记录

### 为什么用 `config.ts` 而非 `config.yaml`？

- TypeScript 原生支持，有完整类型推导和 IDE 补全
- 无需引入 `js-yaml` 等额外依赖
- 配置结构变化时编译器会主动报错，而非运行时 crash

### 为什么用 `rehype-highlight` 而非 `rehype-shiki`？

`rehype-shiki@0.0.9` 依赖 `shiki-languages` 等旧版 CJS 包，无法在 ESM 模块链（remark 15+）中正常使用。`rehype-highlight` 基于 `highlight.js`，ESM 兼容，且支持与主题样式文件解耦。

### 为什么 Navbar 要拆分 Server + Client？

Next.js App Router 中，Server Component 不能包含 `useState` 等客户端 Hook。将搜索按钮和弹窗状态隔离到 `NavbarClient.tsx`，导航链接和站点标题保持在 Server Component 中渲染，减少客户端 JS 体积。

### `output: 'export'` 的限制

- 不支持 API Routes（`app/api/`）
- 不支持 Next.js Image Optimization（已设置 `unoptimized: true`）
- `next/dynamic` 的动态导入在构建时会被静态打包，切换主题需要重新构建

---

## 5. 自定义主题

### 创建自定义主题

1. 在 `src/themes/` 下新建目录，例如 `src/themes/dark-pro/`
2. 只放需要覆盖的组件，其余自动继承 `base` 主题

   ```text
   src/themes/dark-pro/
   └── Navbar.tsx    ← 只覆盖导航栏，其他组件用 base 的
   ```

3. 修改 `src/core/config.ts`：

   ```ts
   theme: 'dark-pro',
   ```

4. 重新构建：`npm run build`

### 组件 Props 类型

自定义主题组件必须接受与 base 主题相同的 Props，类型定义在 `src/core/types/index.ts`：

| 组件 | Props 类型 |
|:---|:---|
| `Navbar` | 无 Props |
| `PostCard` | `PostCardProps` |
| `ArchiveList` | `ArchiveListProps` |
| `Calendar` | `CalendarProps` |
| `Pagination` | `PaginationProps` |

### 修改全局颜色

不需要自定义组件，只需覆盖 `globals.css` 中的 CSS 变量：

```css
:root {
  --color-primary: #e11d48;  /* 改为玫红主色 */
}
```

---

## 6. 部署方式

### 前置条件

- GitHub 仓库已创建
- 仓库 **Settings → Pages → Source** 设置为 `GitHub Actions`

### 标准部署（仓库名为 `username.github.io`）

直接推送到 `main` 分支即可，无需额外配置：

```bash
git push origin main
```

### 子路径部署（仓库名非 `username.github.io`）

1. 在仓库 **Settings → Secrets and variables → Actions → Variables** 添加：

   | Name | Value |
   |:---|:---|
   | `NEXT_PUBLIC_BASE_PATH` | `/你的仓库名` |

2. 推送到 `main` 分支，Actions 会自动注入 basePath 并构建。

### 本地开发

```bash
cd Walle
npm install
npm run dev       # 启动开发服务器 http://localhost:3000
```

### 本地预览生产构建

```bash
npm run build     # 生成 out/ 目录（同时触发 prebuild）
npx serve out     # 本地静态服务器预览
```

### 新增文章

在 `content/posts/` 下创建 `.md` 文件，文件名即为 URL slug：

```markdown
---
title: 我的新文章
date: 2026-03-24
summary: 文章摘要（可选）
tags: [tag1, tag2]
---

正文内容...
```

推送到 `main` 后，Actions 自动重新构建并更新搜索索引。
