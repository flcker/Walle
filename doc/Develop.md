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
   - [Phase 5.1 — GFM 扩展语法](#phase-51--gfm-扩展语法)
   - [Phase 5.2 — Mermaid 图表支持](#phase-52--mermaid-图表支持)
   - [Phase 5.3 — 图片支持](#phase-53--图片支持)
   - [Phase 5.4 — 标签与分类功能](#phase-54--标签与分类功能)
   - [Phase 5.5 — 日/夜模式切换](#phase-55--日夜模式切换)
   - [Phase 5.6 — 配色方案运行时切换](#phase-56--配色方案运行时切换)
   - [Phase 5.7 — Liquid Glass 主题](#phase-57--liquid-glass-主题)
   - [Phase 5.8 — 代码高亮增强](#phase-58--代码高亮增强)
   - [Phase 5.9 — Footer 与 Profile 模块](#phase-59--footer-与-profile-模块)
   - [Phase 6 — 自动化部署](#phase-6--自动化部署)
   - [Phase 7 — 内容仓库分离（可选）](#phase-7--内容仓库分离可选)
4. [关键技术决策记录](#4-关键技术决策记录)
5. [自定义主题](#5-自定义主题)
6. [部署方式](#6-部署方式)

---

---

## 1. 项目结构

```text
Walle/
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions 自动部署
├── app/                          # Next.js App Router 页面层
│   ├── categories/
│   │   ├── page.tsx              # 分类列表页
│   │   └── [category]/
│   │       ├── page.tsx          # 分类文章（第 1 页）
│   │       └── page/[page]/
│   │           └── page.tsx      # 分类文章分页
│   ├── tags/
│   │   ├── page.tsx              # 标签云页
│   │   └── [tag]/
│   │       ├── page.tsx          # 标签文章（第 1 页）
│   │       └── page/[page]/
│   │           └── page.tsx      # 标签文章分页
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
│   ├── posts/                    # Markdown 文章文件夹（平铺，不含子目录）
│   └── assets/                   # 图片资源（支持任意子目录，构建时同步到 public/assets/）
├── public/
│   └── search-index.json         # 构建时自动生成，勿手动修改
├── scripts/
│   └── build-search-index.ts     # 搜索索引生成脚本（prebuild 钩子）
├── src/
│   ├── core/
│   │   ├── config.ts             # 全局配置（唯一配置入口）
│   │   ├── ThemeResolver.tsx     # 运行时主题加载器
│   │   ├── ThemeGlobalStyles.tsx # 主题 CSS 注入（Server Component）
│   │   ├── lib/
│   │   │   ├── posts.ts          # 文章解析与数据函数
│   │   │   ├── useTheme.ts       # 亮/暗模式切换 Hook
│   │   │   └── useColorScheme.ts # 配色方案切换 Hook
│   │   └── types/
│   │       └── index.ts          # 全局 TypeScript 类型定义
│   └── themes/
│       ├── base/                 # 默认主题（完整实现）
│       │   ├── ArchiveList.tsx
│       │   ├── Calendar.tsx
│       │   ├── CategoryList.tsx
│       │   ├── Footer.tsx
│       │   ├── Navbar.tsx
│       │   ├── NavbarClient.tsx  # 搜索按钮（Client Component）
│       │   ├── Pagination.tsx
│       │   ├── PostCard.tsx
│       │   ├── Profile.tsx
│       │   ├── SearchModal.tsx   # 搜索弹窗（Client Component）
│       │   └── TagList.tsx
│       ├── liquid-glass/         # Liquid Glass 主题（当前激活）
│       │   ├── theme.css         # 结构 CSS（blob 动画 + 玻璃卡片结构，无颜色）
│       │   ├── schemes/          # 配色方案
│       │   │   ├── aurora.css    #   靛蓝极光（默认）
│       │   │   ├── sunset.css    #   日落珊瑚
│       │   │   ├── ocean.css     #   深海蓝绿
│       │   │   └── rose.css      #   玫瑰粉
│       │   ├── Navbar.tsx
│       │   ├── NavbarClient.tsx  # 配色方案切换 + 主题切换 + 搜索（Client Component）
│       │   ├── PostCard.tsx
│       │   ├── Footer.tsx
│       │   └── Profile.tsx
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
| `remark-gfm` | 4.x | GFM 扩展：删除线、任务列表、表格 |
| `beautiful-mermaid` | latest | Node.js 同步渲染 Mermaid 图表为 SVG |

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
  → gray-matter         提取 Frontmatter + 原始内容
  → remark()            解析为 Markdown AST
  → remark-gfm          GFM 扩展（删除线/任务列表/表格）
  → remark-rehype       转换为 HTML AST
  → rehypeMermaid       Mermaid 代码块渲染为内联 SVG（自定义插件）
  → rehype-highlight    代码块添加高亮 class（构建时静态，无运行时 JS）
  → rehypeAssetPath     规范化图片路径 + 补全 basePath（自定义插件）
  → rehype-stringify    序列化为 HTML 字符串（allowDangerousHtml: true）
```

#### 日期优先级策略

```
resolvePostDate(frontmatterDate, filePath)
  1. Frontmatter date 字段（优先）
  2. 文件系统 mtime（兜底）
  [可选扩展] Git commit 时间（需 fetch-depth: 0，见 Phase 7.3）
```

#### 导出的数据访问函数

| 函数 | 说明 |
|:---|:---|
| `getAllPosts()` | 读取并解析所有文章，按日期降序 |
| `getPostBySlug(slug)` | 按 slug 查找单篇，不存在返回 `null` |
| `getGroupedArchives()` | 按年份分组，年份降序 |
| `getPaginatedPosts(page)` | 分页，读取 `siteConfig.postsPerPage` |
| `getAllTags()` | 返回所有标签及文章数，按数量降序 |
| `getAllCategories()` | 返回所有分类及文章数，按数量降序 |
| `getPostsByTag(tag, page)` | 按标签过滤文章，支持分页 |
| `getPostsByCategory(category, page)` | 按分类过滤文章，支持分页 |

所有函数均为 `async`，仅在 Node.js 环境（构建时/Server Component）调用，不会打包进客户端 JS。

---

### Phase 3 — 视图层：Base 主题

#### CSS 变量系统

`app/globals.css` 定义 7 个语义变量作为 **兜底默认值**（base 主题生效），各主题通过自己的 `theme.css` 覆盖：

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

#### 主题 CSS 注入机制（ThemeGlobalStyles）

`src/core/ThemeGlobalStyles.tsx` 是一个 Server Component，在构建时读取当前主题的 CSS 文件并以内联 `<style>` 注入到 `<head>`。支持两种模式：

**无配色方案（普通主题）**
```
app/layout.tsx <head>
  └── <ThemeGlobalStyles />
        └── fs.readFileSync(`src/themes/${theme}/theme.css`)
              → <style>{ css }</style>
```

**有配色方案（如 liquid-glass）**

`ThemeGlobalStyles` 遍历 `schemes/` 目录，将所有 CSS 文件（按文件名排序）全部注入到同一个 `<style>` 中，再追加 `theme.css`：

```
app/layout.tsx <head>
  └── <ThemeGlobalStyles />
        ├── fs.readdirSync(`src/themes/${theme}/schemes/`)
        │     → 所有 .css 文件（aurora.css + ocean.css + rose.css + sunset.css）
        │     → 每个文件的选择器带 html[data-color-scheme="xxx"] 前缀
        └── fs.readFileSync(`src/themes/${theme}/theme.css`)
              → <style>{ 合并后的 css }</style>
```

配色方案的选择在客户端运行时进行，通过 `html[data-color-scheme]` 属性驱动（见 useColorScheme 章节）。`siteConfig.themeOptions.colorScheme` 作为默认值使用。

**设计目标**：主题切换（包括颜色变量、动画、特效类、配色方案）完全在 `src/themes/<name>/` 内完成，不需要修改 `app/` 目录下的任何文件。`app/globals.css` 仅保留结构性样式和 base 兜底变量。

#### Base 主题组件

| 组件 | 类型 | 说明 |
|:---|:---|:---|
| `Navbar.tsx` | Server Component | 静态导航结构，包含 NavbarClient |
| `NavbarClient.tsx` | Client Component | 控制主题切换按钮与搜索弹窗（base 主题）；liquid-glass 主题有自己的 NavbarClient 额外包含配色方案切换 |
| `PostCard.tsx` | Server Component | 文章卡片 |
| `ArchiveList.tsx` | Server Component | 按年份分组的归档列表 |
| `Calendar.tsx` | Server Component | 月历，受 `features.calendar` 控制 |
| `Pagination.tsx` | Server Component | 翻页导航，仅一页时不渲染 |
| `SearchModal.tsx` | Client Component (`ssr: false`) | 搜索弹窗主体 |

#### 暗色模式与代码块高亮

`app/layout.tsx` 全局引入 `highlight.js/styles/github.css` 作为代码块亮色兜底基础。

暗色模式兜底规则写在 `app/globals.css` 末尾，覆盖 `github.css` 的亮色 token 颜色：

```css
/* 响应系统偏好 */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .hljs { background: #161b22; color: #c9d1d9; }
}
/* 响应手动切换 */
[data-theme="dark"] .hljs { background: #161b22; color: #c9d1d9; }
```

liquid-glass 主题的每套 scheme.css 末尾额外追加了与该配色方案匹配的 `.hljs-*` token 颜色覆盖，注入优先级高于 `github.css`（内联 `<style>` 后置），因此代码块配色随当前 scheme 自动变化。

#### GFM 元素样式

删除线和表格由 `@tailwindcss/typography` 的 prose 样式内置支持，无需额外 CSS。

任务列表的 checkbox 需要自定义样式（prose 默认隐藏 checkbox），追加到 `app/globals.css`：

```css
.contains-task-list { list-style: none; padding-left: 0; }
.task-list-item { display: flex; align-items: flex-start; gap: 0.5rem; }
.task-list-item input[type="checkbox"] {
  margin-top: 0.25rem;
  accent-color: var(--color-primary);
  cursor: default;
}
```

使用语义变量 `--color-primary` 驱动 checkbox 选中颜色，自动适配所有配色方案和亮/暗模式。

#### Mermaid 图表样式

`app/globals.css` 追加 `.mermaid-diagram` 样式块，控制图表容器和 SVG 内部颜色：

```css
.mermaid-diagram { width: fit-content; margin: 1.5em auto; }
.mermaid-diagram svg {
  --bg: var(--color-background) !important;
  --fg: var(--color-text) !important;
  --accent: var(--color-primary) !important;
  --surface: var(--color-surface) !important;
  --border: var(--color-border) !important;
  --muted: var(--color-text-muted) !important;
}
```

`beautiful-mermaid` 渲染 SVG 时在内部使用 `--bg`/`--fg`/`--accent` 等变量，通过上述映射绑定到项目语义色变量。浏览器运行时解析，单次渲染自动适配当前 scheme 和亮/暗模式组合，无需为每种变体分别生成 SVG。

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
| `/categories` | `app/categories/page.tsx` | Static |
| `/categories/[category]` | `app/categories/[category]/page.tsx` | SSG（`generateStaticParams`） |
| `/categories/[category]/page/[page]` | `app/categories/[category]/page/[page]/page.tsx` | SSG（`generateStaticParams`） |
| `/tags` | `app/tags/page.tsx` | Static |
| `/tags/[tag]` | `app/tags/[tag]/page.tsx` | SSG（`generateStaticParams`） |
| `/tags/[tag]/page/[page]` | `app/tags/[tag]/page/[page]/page.tsx` | SSG（`generateStaticParams`） |

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

### Phase 5.1 — GFM 扩展语法

remark 默认不支持 GitHub Flavored Markdown，需显式启用 `remark-gfm` 插件。

#### 注册插件

```ts
// src/core/lib/posts.ts
import remarkGfm from "remark-gfm";

// 在 remark-rehype 之前注册（GFM 扩展的是 Markdown AST 层）
const processor = remark()
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  // ...
```

#### 支持的语法

| 语法 | 示例 |
|:---|:---|
| 删除线 | `~~删除文本~~` |
| 任务列表 | `- [x] 已完成` / `- [ ] 待办` |
| 表格 | `\| 列1 \| 列2 \|` |

任务列表的 CSS 样式见 [Phase 3 — GFM 元素样式](#gfm-元素样式)。

---

### Phase 5.2 — Mermaid 图表支持

#### 选型理由

官方 `mermaid.js` 依赖浏览器 DOM（`document`/`window`），在 Node.js 构建环境无法直接调用。`beautiful-mermaid` 纯 Node.js 同步渲染，零 DOM 依赖，与 `output: 'export'` 的构建时静态生成完全兼容。

#### rehypeMermaid 自定义插件

位于 `src/core/lib/posts.ts`，核心逻辑：

1. 遍历 hast 树，找到 `pre > code.language-mermaid` 节点（同步 `visit()`）
2. 无 mermaid 节点时提前返回，跳过 import
3. 通过 `await import('beautiful-mermaid')` 懒加载模块，调用 `renderMermaidSVG(code)` 渲染
4. 将整个 `<pre>` 替换为 `<div class="mermaid-diagram">` + raw SVG
5. 渲染失败时 fallback：保留原始代码块（不中断构建）

**ESM/CJS 兼容**：`beautiful-mermaid` 是 ESM-only 包（仅有 `import` 导出条件，无 `require`）。`prebuild` 阶段 `tsx` 在 CJS 模式下运行，静态 `import` 会被转译为 `require()` 从而触发 `ERR_PACKAGE_PATH_NOT_EXPORTED`。改用动态 `await import()` 后，Node.js 始终以 ESM 方式解析，绕开此问题。transformer 声明为 `async` 函数，`unified` pipeline 原生支持 async transformer。

**插件顺序约束**：`rehypeMermaid` 必须在 `rehypeHighlight` **之前**注册——否则 highlight.js 会尝试对 mermaid 语法进行高亮，产生错误的输出。

`rehypeStringify` 需配置 `allowDangerousHtml: true`，允许输出内联 SVG 的 raw HTML。

#### 主题适配

SVG 内部颜色通过 CSS 变量映射自动适配，见 [Phase 3 — Mermaid 图表样式](#mermaid-图表样式)。

---

### Phase 5.3 — 图片支持

#### 目录约定

| 目录 | 用途 | 说明 |
|:---|:---|:---|
| `content/assets/` | 文章图片资源 | 支持任意子目录 |
| `content/posts/` | Markdown 文章 | 平铺，不含子目录 |
| `public/assets/` | 构建输出 | 由 prebuild 自动同步，勿手动修改 |

#### Markdown 写法

文章内引用图片使用**相对路径**：

```markdown
![图片说明](../assets/图片名.png)
![子目录图片](../assets/screenshots/demo.png)
```

相对路径基于 `content/posts/` 目录定位，VS Code、Typora、Obsidian 等编辑器本地预览时可正确解析。

#### rehypeAssetPath 自定义插件

构建时由 `src/core/lib/posts.ts` 中的 `rehypeAssetPath` 插件处理：

1. 遍历 hast 树中的 `<img>` 节点
2. 仅处理 `../assets/` 开头的路径（外部链接 `https://` 不受影响）
3. 规范化为 `/assets/<相对路径>`
4. 读取 `process.env.NEXT_PUBLIC_BASE_PATH` 补全前缀（GitHub Pages 子路径场景）

#### 构建脚本同步

`scripts/build-search-index.ts` 末尾追加：

```ts
fs.cpSync(assetsDir, publicAssetsDir, { recursive: true });
```

`npm run prebuild` 执行时自动将 `content/assets/` 递归同步到 `public/assets/`。

#### 开发工作流注意事项

`npm run dev` 不触发 prebuild，新增图片后需先执行：

```bash
npm run prebuild
```

---

### Phase 5.4 — 标签与分类功能

#### 数据层变更

**`Post` 接口**新增 `category: string` 字段（空字符串表示未分类）。

**`SearchIndexItem`** 同步新增 `category: string`，`scripts/build-search-index.ts` 对应更新。

Frontmatter 新增可选字段：

```markdown
---
category: 技术    # 单个分类，空字符串或不填表示未分类
tags: [tag1, tag2]
---
```

#### 组件注册

`src/core/ThemeResolver.tsx` 新增两个 Themed 组件：

```ts
export const ThemedTagList = dynamic<TagListProps>(
  () => import(`../themes/${theme}/TagList`).catch(() => import("../themes/base/TagList"))
);
export const ThemedCategoryList = dynamic<CategoryListProps>(
  () => import(`../themes/${theme}/CategoryList`).catch(() => import("../themes/base/CategoryList"))
);
```

#### 路由页面

新增 8 个路由页面，均实现 `generateStaticParams()` 预生成所有路径：

```
app/categories/page.tsx                              # 分类列表
app/categories/[category]/page.tsx                   # 分类文章第 1 页
app/categories/[category]/page/[page]/page.tsx       # 分类文章分页
app/tags/page.tsx                                    # 标签云
app/tags/[tag]/page.tsx                              # 标签文章第 1 页
app/tags/[tag]/page/[page]/page.tsx                  # 标签文章分页
```

**导航栏**：`base/Navbar.tsx` 在归档链接后新增"分类"和"标签"入口。

#### URL 编码策略

标签/分类名支持中文，`generateStaticParams` 使用 `encodeURIComponent` 生成路径参数，页面内用 `decodeURIComponent` 还原后再查询数据：

```ts
// generateStaticParams
return categories.map(({ name }) => ({ category: encodeURIComponent(name) }));

// 页面组件
const categoryName = decodeURIComponent(params.category);
const posts = await getPostsByCategory(categoryName, 1);
```

分页器的 `basePath` 传入已编码的路径（如 `/tags/%E6%8A%80%E6%9C%AF/page`），保证链接正确。

---

### Phase 5.5 — 日/夜模式切换

#### 配置开关

`siteConfig.features.themeToggle: true` 控制切换按钮是否显示。

#### useTheme Hook

`src/core/lib/useTheme.ts` 封装主题切换逻辑：

| 状态 | 说明 |
|:---|:---|
| 无 `data-theme` + 系统暗色偏好 | 呈现暗色 |
| `data-theme="dark"` | 强制暗色 |
| `data-theme="light"` | 强制亮色 |

Hook 使用 `mounted` flag 防止 SSR 与客户端不一致（水合前返回默认值，水合后读 localStorage）。

#### tailwind.config.ts 配置

```ts
darkMode: ['selector', '[data-theme="dark"]'],
```

使 `dark:prose-invert` 等 Tailwind `dark:` 前缀类随 `data-theme` 属性切换（而非仅响应系统偏好）。

#### 防 FOUC

`app/layout.tsx` 在 `<head>` 中注入阻塞内联脚本，React 水合前同步设置 `data-theme`：

```html
<script dangerouslySetInnerHTML={{ __html: `
  (function() {
    var t = localStorage.getItem('theme');
    if (t === 'dark' || t === 'light') {
      document.documentElement.setAttribute('data-theme', t);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  })();
` }} />
```

#### 切换按钮 UI

`src/themes/base/NavbarClient.tsx` 在 `mounted=true` 后渲染切换按钮（防止 SSR/客户端图标不一致），使用月亮/太阳 SVG 图标，`onClick` 调用 `toggle()`。

---

### Phase 5.6 — 配色方案运行时切换

liquid-glass 主题支持在页面上实时切换配色方案（aurora / sunset / ocean / rose），无需刷新页面。

#### 技术方案

**关键约束**：`ThemeGlobalStyles` 是 Server Component，只能静态注入 CSS，无法运行时替换。

**解法**：构建时将所有 scheme 的 CSS 一次性全部注入，每套 scheme 的选择器带 `html[data-color-scheme="xxx"]` 前缀。客户端切换时只修改 `<html>` 的 `data-color-scheme` 属性，浏览器自动响应对应 scheme 的变量。

#### scheme.css 选择器结构

```css
/* 亮色 */
html[data-color-scheme="aurora"] { --color-background: #f0f4ff; ... }

/* 暗色（响应系统偏好） */
@media (prefers-color-scheme: dark) {
  html[data-color-scheme="aurora"]:not([data-theme="light"]) { --color-background: #06061a; ... }
}
/* 暗色（响应手动切换） */
html[data-color-scheme="aurora"][data-theme="dark"] { --color-background: #06061a; ... }
```

#### useColorScheme Hook

`src/core/lib/useColorScheme.ts`：镜像 `useTheme` 的设计，管理 `data-color-scheme` 属性。

- localStorage key：`color-scheme`
- 默认值：`siteConfig.themeOptions.colorScheme`
- 挂载前返回默认值（防止 SSR/客户端不一致）

#### 防 FOUC

`app/layout.tsx` 的阻塞内联脚本在 React 水合前同步设置 `data-color-scheme`：

```ts
var cs = localStorage.getItem('color-scheme') || '${defaultColorScheme}';
document.documentElement.setAttribute('data-color-scheme', cs);
```

#### Navbar 中的切换 UI

配色方案切换 UI 属于 liquid-glass 主题的特性，放在 `src/themes/liquid-glass/NavbarClient.tsx`（而非 `base/NavbarClient.tsx`），保证 base 主题不感知此功能，其他主题可各自实现或不实现配色切换。

`liquid-glass/Navbar.tsx` 导入自己的 `./NavbarClient`，base 的 `Navbar.tsx` 仍导入 `./NavbarClient`（base 版本）。

防 FOUC 脚本中，`data-color-scheme` 初始化与 `data-theme` 初始化合并在同一个内联脚本块中：

```ts
var cs = localStorage.getItem('color-scheme') || '${defaultColorScheme}';
document.documentElement.setAttribute('data-color-scheme', cs);
```

`siteConfig.themeOptions.colorSchemes` 数组（如 `['aurora', 'sunset', 'ocean', 'rose']`）供切换 UI 遍历，展示所有可选方案。

---

### Phase 5.7 — Liquid Glass 主题

#### 架构设计

主题内容完全自包含于 `src/themes/liquid-glass/`，激活只需修改 `config.ts` 的 `theme: 'liquid-glass'`，不需要改动 `app/` 目录任何文件。

`theme.css`（结构 CSS）与 `schemes/*.css`（配色方案）分离设计：

| 文件 | 内容 |
|:---|:---|
| `theme.css` | blob 动画关键帧、玻璃卡片 `backdrop-filter`、`border-radius` 等结构属性（不含颜色） |
| `schemes/*.css` | 颜色变量 + Blob 颜色 + 卡片背景 + 代码高亮 token 颜色覆盖 |

所有配色方案共享 `theme.css`，颜色变量各自独立，可按需增减方案而无需修改结构。

#### 四套配色方案

| 方案 | 亮色主色 | 暗色主色 | Blob 色系 |
|:---|:---|:---|:---|
| `aurora` | `#4f46e5` | `#818cf8` | 靛蓝 + 紫 + 青 |
| `sunset` | `#ea580c` | `#fb923c` | 橙 + 玫红 + 金 |
| `ocean` | `#0891b2` | `#22d3ee` | 青 + 蓝绿 + 天蓝 |
| `rose` | `#e11d48` | `#fb7185` | 玫红 + 粉 + 紫 |

#### ThemeGlobalStyles 加载顺序

`src/core/ThemeGlobalStyles.tsx` 注入 CSS 时：

1. 遍历 `schemes/` 目录，按文件名排序，逐个读取所有 scheme CSS 文件
2. 追加 `theme.css`（结构 CSS 后置，确保覆盖 scheme 中可能的同名声明）
3. 合并为单个 `<style>` 内联注入到 `<head>`

**关键**：scheme CSS 先注入（提供颜色变量），`theme.css` 后注入（提供结构类）。

#### 主题特有组件

| 组件 | 说明 |
|:---|:---|
| `Footer.tsx` | 液态玻璃风格页脚 |
| `Profile.tsx` | 玻璃卡片个人信息模块 |
| `NavbarClient.tsx` | 集成配色方案切换 + 日/夜切换 + 搜索（三合一客户端控件） |

---

### Phase 5.8 — 代码高亮增强

代码块高亮采用三层 CSS 覆盖策略，保证在任意主题、任意配色方案、亮/暗模式下均有合适的配色。

#### 三层覆盖结构

| 层次 | 位置 | 作用 | 禁止操作 |
|:---|:---|:---|:---|
| 1（底层）| `app/layout.tsx` import `github.css` | 所有主题的亮色兜底 | **禁止删除或替换** |
| 2（中层）| `app/globals.css` 末尾 | base/无 scheme 主题的暗色保障 | — |
| 3（顶层）| `schemes/*.css` 末尾 | liquid-glass 各配色方案专属 token 颜色 | — |

第 3 层以内联 `<style>` 形式注入，优先级高于 bundle CSS，覆盖第 1 层的 `github.css`。

#### 第 2 层：globals.css 暗色兜底

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .hljs { background: #161b22; color: #c9d1d9; }
}
[data-theme="dark"] .hljs { background: #161b22; color: #c9d1d9; }
```

github-dark 风格，兼容系统偏好和手动切换两种暗色触发方式。

#### 第 3 层：scheme 专属 token 颜色

每套 scheme CSS 末尾追加的高亮规则选择器结构：

```css
/* 亮色 */
html[data-color-scheme="aurora"] .hljs-keyword { color: #6366f1; }

/* 暗色（系统偏好） */
@media (prefers-color-scheme: dark) {
  html[data-color-scheme="aurora"]:not([data-theme="light"]) .hljs-keyword { color: #a5b4fc; }
}
/* 暗色（手动切换） */
html[data-color-scheme="aurora"][data-theme="dark"] .hljs-keyword { color: #a5b4fc; }
```

代码块配色随当前配色方案和亮/暗模式自动变化，无需 JavaScript 干预。

---

### Phase 5.9 — Footer 与 Profile 模块

#### Footer

**配置**：`siteConfig.footer.copyright` 字段，版权归属名。

**组件**：`src/themes/base/Footer.tsx` 渲染：

```
© {当前年份} {copyright} · Powered by Walle
```

使用 `text-muted text-sm` 语义类，顶部 `border-border` 分割线。

**粘底布局**：`app/layout.tsx` 修改为 `flex flex-col`，`<main>` 加 `flex-1`，`<ThemedFooter />` 置于 `main` 之后——短页面时 main 自动拉伸，Footer 始终位于视口底部。

#### Profile 显示模式

`siteConfig.profile.show` 支持 5 种取值：

| 值 | 显示位置 | 说明 |
|:---|:---|:---|
| `false` | 不显示 | Profile 完全不渲染 |
| `'home-top'` | 首页顶部 | `app/page.tsx` 条件渲染 `<ThemedProfile />`（仅首页第 1 页） |
| `'home-bottom'` | 首页底部 | 同上，位置在文章列表之后 |
| `'header-inline'` | 导航栏内嵌 | Navbar 左侧嵌入头像 + 名字 + 简介（随导航栏 sticky） |
| `'header-banner'` | 导航栏上方横幅 | 独立横幅区域（非 sticky）+ 下方 sticky 导航栏 |

**`base/Navbar.tsx`** 内部根据 `siteConfig.profile.show` 选择渲染路径：`header-inline` 和 `header-banner` 由 Navbar 直接处理，`home-*` 和 `false` 由 Navbar 之外的页面层处理。

**头像资源**：放 `content/assets/`，prebuild 同步到 `public/assets/`，`siteConfig.profile.avatar` 配置 `/assets/avatar.svg` 格式的 public URL。组件内通过 `assetUrl()` 处理 basePath：

```tsx
import { assetUrl } from "@/src/core/config";
<Image src={assetUrl(profile.avatar)} alt={profile.name} ... />
```

---

### Phase 6 — 自动化部署

> 部署上线只需三步：
> 1. 将 Walle/ 目录推送到 GitHub 仓库;
> 2. 在仓库 `Settings` → `Pages` → `Source` 选择 `GitHub Actions`;
> 3. 若仓库名非 username.github.io，在 Settings → Variables → Actions 添加 `NEXT_PUBLIC_BASE_PATH=/仓库名`;

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

### Phase 7 — 内容仓库分离（可选）

适用于文章编写者与代码开发者分离，或希望文章更新不触发代码 CI 的场景。

#### 仓库角色

| 仓库 | 职责 |
|:---|:---|
| `blog-code`（公开） | Walle 代码库，不含文章 |
| `blog-content`（可私有） | 纯 Markdown 文章 + `content/assets/` |

#### 触发链路

```
blog-content push（main 分支）
  → .github/workflows/notify.yml
  → curl 触发 blog-code 的 repository_dispatch（event: content-updated）
  → blog-code .github/workflows/deploy.yml
  → npm run build（clone blog-content 到 content/ 后执行）
  → GitHub Pages 更新
```

#### 关键配置

**blog-content 仓库**：创建 `.github/workflows/notify.yml`，Push 时发送 `repository_dispatch` 请求。

**GitHub PAT（Fine-grained Token）**：
- 权限范围：`blog-code` 仓库的 `Actions: write`
- 存入 `blog-content` 仓库 Secrets，变量名 `BLOG_CODE_DISPATCH_TOKEN`

**blog-code `deploy.yml` 更新**：

```yaml
on:
  push:
    branches: [main]
  repository_dispatch:
    types: [content-updated]
```

构建步骤中在 `npm run build` 之前 clone content 仓库：

```yaml
- name: Clone content
  run: |
    git clone https://x-access-token:${{ secrets.CONTENT_REPO_TOKEN }}@github.com/user/blog-content.git _content
    cp -r _content/posts ./content/
    cp -r _content/assets ./content/
```

私有内容仓库需要在 `blog-code` 仓库 Secrets 中额外添加 `CONTENT_REPO_TOKEN`（对 `blog-content` 有读取权限的 PAT）。

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

### 为什么用 `beautiful-mermaid` 而非官方 `mermaid.js`？

官方 `mermaid.js` 依赖浏览器 DOM（`document`/`window`），在 Node.js 构建环境中无法直接调用，需要引入 `puppeteer` 或 `@mermaid-js/mermaid-isomorphic` 等重量级适配层。`beautiful-mermaid` 纯 Node.js 同步渲染，零 DOM 依赖，与 `output: 'export'` 的构建时静态生成完全兼容，且无需额外的浏览器运行时。

### 为什么 Mermaid SVG 用 CSS 变量映射而非渲染多套 SVG？

每种配色方案 × 亮/暗模式 = 8 种颜色变体，构建时无法预知用户当前处于哪种状态。CSS 变量映射方案：SVG 内部使用 `--bg`/`--fg`/`--accent` 等变量，由浏览器运行时根据当前 `data-color-scheme` 和 `data-theme` 属性解析，单次渲染自动适配所有组合，构建产物体积不随方案数量增长。

### 为什么图片用相对路径 `../assets/` 而非 `/assets/` 绝对路径？

相对路径让 VS Code、Typora、Obsidian 等本地编辑器在预览时能正确解析图片（相对于 `content/posts/` 定位到 `content/assets/`）；绝对路径在编辑器中预览必然 404（编辑器没有 public 目录的概念）。构建时由 `rehypeAssetPath` 插件统一转换为绝对路径并补全 basePath，开发体验与构建结果两端均兼容。

### 为什么标签/分类 URL 用 `encodeURIComponent` 而非 slug 化？

`encodeURIComponent("技术")` → `%E6%8A%80%E6%9C%AF`，Next.js 的 `generateStaticParams` 以此为参数名生成静态文件，`decodeURIComponent` 在页面内还原为原始名称再查询数据。相比转拼音 slug 化：不损失语义（"技术" vs "ji-shu"）、无需引入 `pinyin` 等额外依赖，且 GitHub Pages 完整支持 percent-encoded URL。

### 为什么 Footer 用 `flex flex-col` + `flex-1 on main` 而非 `min-h-screen`？

`min-h-screen` 只保证 body 的最小高度等于视口高度，短页面时 Footer 会紧贴 main 内容底部而非停在视口底部。`body: flex flex-col` + `main: flex-1` 让 main 区域自动拉伸填满 body 中剩余的所有空间，Footer 因此始终被推到视口底部，短内容和长内容页面均表现正确。

---

## 5. 自定义主题

### 创建自定义主题

1. 在 `src/themes/` 下新建目录，例如 `src/themes/dark-pro/`
2. 按需放置组件和/或 `theme.css`，其余自动继承 `base` 主题

   ```text
   src/themes/dark-pro/
   ├── theme.css     ← 颜色变量、动画、特效类（可选）
   └── Navbar.tsx    ← 覆盖导航栏（可选）
   ```

3. 修改 `src/core/config.ts`：

   ```ts
   theme: 'dark-pro',
   ```

4. 重新构建：`npm run build`

> **无需修改 `app/` 目录任何文件。** `ThemeGlobalStyles` 会自动读取并注入新主题的 `theme.css`。

### 多配色方案（schemes/）

若一个主题需要支持多套配色（如 `liquid-glass`），可将颜色相关 CSS 拆分到 `schemes/` 子目录：

```text
src/themes/my-theme/
├── theme.css           ← 结构 CSS（动画、卡片形状，不含颜色）
└── schemes/
    ├── default.css     ← 默认配色
    └── warm.css        ← 暖色配色
```

在 `config.ts` 中通过 `themeOptions.colorScheme` 选择：

```ts
theme: 'my-theme',
themeOptions: {
  colorScheme: 'warm',   // 对应 schemes/warm.css
},
```

`ThemeGlobalStyles` 会注入 `schemes/` 目录下的**所有** CSS 文件，每套 scheme 通过 `html[data-color-scheme="xxx"]` 选择器隔离，运行时切换只需修改 `<html>` 属性。`siteConfig.themeOptions.colorScheme` 用作默认配色方案的初始值。

### theme.css 结构（推荐）

```css
/* 亮色调色板 */
:root {
  --color-background: ...;
  --color-primary: ...;
  /* 其他变量 */
}

/* 暗色调色板 */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { ... }
}
[data-theme="dark"] { ... }

/* 主题特效类（动画、卡片样式等） */
.my-card { ... }
```

### 组件 Props 类型

自定义主题组件必须接受与 base 主题相同的 Props，类型定义在 `src/core/types/index.ts`：

| 组件 | Props 类型 |
|:---|:---|
| `Navbar` | 无 Props |
| `PostCard` | `PostCardProps` |
| `ArchiveList` | `ArchiveListProps` |
| `Calendar` | `CalendarProps` |
| `Pagination` | `PaginationProps` |
| `TagList` | `TagListProps` |
| `CategoryList` | `CategoryListProps` |
| `Footer` | `FooterProps` |
| `Profile` | `ProfileProps` |

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
category: 技术        # 可选，单个分类，空字符串或不填表示未分类
tags: [tag1, tag2]
---

正文内容...
```

推送到 `main` 后，Actions 自动重新构建并更新搜索索引。
