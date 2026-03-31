> 这是经过全面优化和更新的静态博客系统技术方案。该方案整合了"配置驱动（TypeScript）"、"多主题继承架构（运行时加载）"以及"自动化发布流"的核心逻辑，旨在通过高度解耦的结构，让你的博客既易于维护，又具备极强的扩展性。

# 静态博客系统技术方案 (Updated v2.1)

---

## 1. 核心设计思想：配置驱动与主题解耦

系统将分为三层：

**数据层 (Data)**：存储在 content/ 的 Markdown 文件和 src/core/config.ts 配置文件。
**核心层 (Core)**：处理 Markdown 解析、归档逻辑、搜索索引生成、配置读取。
**视图层 (Themes)**：包含 Base Theme (默认组件库) 和 Custom Theme (覆盖层)，支持运行时动态加载。


## 2. 目录结构规范

```text
/
├── src/
│   ├── core/
│   │   ├── config.ts         # 网站全局配置（标题、作者、主题选择、功能开关）
│   │   ├── lib/              # post解析器, 搜索索引生成器
│   │   └── types/            # TypeScript 类型定义
│   ├── themes/               # 主题仓库
│   │   ├── base/             # 基础主题（必须包含完整的组件实现）
│   │   └── my-theme/         # 用户自定义主题（可选，仅需存放差异化组件）
│   └── app/                  # Next.js 14+ App Router 路由
├── content/                  # 文章存储（按 Git 同步）
│   └── posts/                # .md 文件
├── public/
│   └── search-index.json     # 构建时生成的搜索索引
└── .github/workflows/        # GitHub Actions 部署脚本
```


## 3. 技术栈细化表

|模块|推荐工具|作用|
|:---|:---|:---|
|基础框架|Next.js 14 (App Router)|提供 SSG 静态生成和高效路由|
|配置管理|`src/core/config.ts`|TypeScript 原生导出，类型安全，无额外依赖|
|内容解析|gray-matter + remark|提取 Frontmatter 并渲染 Markdown|
|代码高亮|rehype-shiki|构建时静态代码高亮，无运行时开销|
|样式方案|Tailwind CSS|基于 CSS 变量实现主题动态换肤|
|搜索引擎|Fuse.js|客户端轻量级模糊搜索|
|日期处理|date-fns|格式化日期、计算归档与日历逻辑|


## 4. 关键功能逻辑说明

### A. 配置管理 (config.ts)

使用 TypeScript 文件代替 YAML，直接导出强类型配置对象，享受类型检查与 IDE 补全：

```ts
// src/core/config.ts
export const siteConfig = {
  title: '我的博客',
  author: 'Your Name',
  theme: 'base',           // 切换主题只需修改此字段
  postsPerPage: 10,
  features: {
    search: true,
    calendar: true,
  },
} as const;

export type SiteConfig = typeof siteConfig;
```

### B. 运行时主题加载 (Theme Resolver)

主题切换在**运行时**通过 Next.js `dynamic()` 实现，无需重新构建即可生效（通过修改 `config.ts` 中的 `theme` 字段并触发重新部署）。

在 `src/core/ThemeResolver.tsx` 中实现：

1. 读取 `siteConfig.theme` 字段获取当前主题名。
2. 使用 `next/dynamic` 动态导入 `src/themes/[theme-name]/[Component]`。
3. 若目标主题目录中不存在该组件，自动 Fallback 到 `src/themes/base/[Component]`。

```ts
// src/core/ThemeResolver.tsx
import dynamic from 'next/dynamic';
import { siteConfig } from './config';

export function resolveComponent(componentName: string) {
  // 先尝试加载自定义主题组件
  try {
    return dynamic(
      () => import(`../themes/${siteConfig.theme}/${componentName}`)
        .catch(() => import(`../themes/base/${componentName}`))
    );
  } catch {
    return dynamic(() => import(`../themes/base/${componentName}`));
  }
}
```

> **注意**：`next/dynamic` 配合 `output: 'export'` 时，所有动态导入的组件在构建阶段会被静态打包。`ssr: false` 选项可用于纯客户端交互组件（如搜索弹窗）。

### C. 文章日期优先级策略

日期获取遵循以下优先级，确保 Frontmatter 声明的日期始终优先：

```
1. Frontmatter 中的 date 字段（首选）
2. Git commit 时间戳（扩展功能，需 fetch-depth: 0）
3. 文件系统 mtime（兜底）
```

在 `src/core/lib/posts.ts` 中实现：

```ts
function resolvePostDate(frontmatterDate: string | undefined, filePath: string): Date {
  // 优先使用 Frontmatter date
  if (frontmatterDate) {
    return new Date(frontmatterDate);
  }
  // 扩展：尝试从 Git log 读取（仅在 CI 环境 fetch-depth: 0 时有效）
  // 生产环境兜底使用文件 mtime
  return fs.statSync(filePath).mtime;
}
```

> Git 时间戳提取为可选扩展功能，需在 GitHub Actions 中配置 `fetch-depth: 0`，并通过 `git log --follow -1 --format="%aI"` 获取。

### D. 搜索索引生成方案

搜索索引在**构建阶段**由 `scripts/build-search-index.ts` 脚本生成，输出至 `public/search-index.json`。

**生成时机**：通过 `package.json` 的 `prebuild` 钩子自动触发，确保每次构建前索引都是最新的。

```json
// package.json
{
  "scripts": {
    "prebuild": "tsx scripts/build-search-index.ts",
    "build": "next build"
  }
}
```

**索引结构**：

```ts
// scripts/build-search-index.ts
import { getAllPosts } from '../src/core/lib/posts';
import fs from 'fs';

const posts = getAllPosts();
const index = posts.map(post => ({
  slug: post.slug,
  title: post.title,
  summary: post.summary ?? post.content.slice(0, 200),
  tags: post.tags ?? [],
  date: post.date,
}));

fs.writeFileSync('public/search-index.json', JSON.stringify(index));
```

**客户端搜索**：Fuse.js 在首次触发搜索时懒加载 `search-index.json`，避免阻塞首屏渲染。受 `siteConfig.features.search` 开关控制，关闭时不渲染搜索入口组件。

### E. 归档与日历数据处理

归档：遍历所有文章，提取 `date` 字段，使用 `reduce` 函数按 `getFullYear()` 分组。
日历：生成一个包含当前月份所有日期的数组，比对文章发布日期，命中则标记为"有内容"。


## 5. AI 指令执行计划 (Implementation Plan)

操作提示：请按顺序将以下"指令块"发送给你的 AI 辅助开发工具。

### 第一步：初始化配置与核心 Loader

> 指令：
> "初始化 Next.js 14 项目，安装 gray-matter、date-fns。在 src/core/config.ts 中以 TypeScript 对象导出网站配置，包含：网站标题、作者信息、当前主题名 (theme: 'base')、每页文章数量，以及功能开关（features.search, features.calendar）。导出 SiteConfig 类型。确保配置在全局 Layout 中可用。"

### 第二步：内容解析与数据中心

> 指令：
> "编写 src/core/lib/posts.ts。实现功能：读取 content/posts/ 下的 Markdown 文件，使用 gray-matter 解析 Frontmatter。日期策略：优先使用 Frontmatter 中的 date 字段，不存在时回退到文件 mtime。要求提供三个函数：getAllPosts()（按日期降序排列）, getGroupedArchives()（按年份分组归档）, getPostBySlug(slug)。从 siteConfig 读取 postsPerPage 用于分页。"

### 第三步：构建基础主题 (Base Theme)

> 指令：
> "在 src/themes/base/ 目录下创建一套标准组件：Navbar.tsx, PostCard.tsx, ArchiveList.tsx, Calendar.tsx。要求：所有颜色使用 Tailwind 的 CSS 变量（如 text-primary），变量值在 globals.css 中定义。这些组件应能直接接收第二步产生的数据类型。"

### 第四步：实现运行时主题覆盖机制

> 指令：
> "创建主题解析器 src/core/ThemeResolver.tsx。使用 next/dynamic 实现运行时动态导入：根据 siteConfig.theme 加载对应主题目录的组件，若组件不存在则通过 .catch() 自动 Fallback 到 base 主题。然后使用此机制创建 app/layout.tsx（Navbar）和 app/archives/page.tsx 页面。注意：所有动态组件在 output: 'export' 下会在构建时静态打包。"

### 第五步：搜索索引生成与交互增强

> 指令：
> "1）编写 scripts/build-search-index.ts：调用 getAllPosts() 提取 slug、title、summary（取 content 前 200 字）、tags、date，写入 public/search-index.json。在 package.json 中配置 prebuild 钩子自动执行此脚本。2）在 base 主题中创建搜索弹窗组件（使用 next/dynamic + ssr: false），首次触发时 fetch search-index.json 并初始化 Fuse.js 实例。该组件受 siteConfig.features.search 开关控制。"

### 第六步：自动化部署环境

> 指令：
> "编写 .github/workflows/deploy.yml。配置 GitHub Actions：当 main 分支有代码或 Markdown 提交时，自动运行 npm run build（prebuild 钩子会自动生成搜索索引）。配置 fetch-depth: 0 以支持 Git 时间戳作为文章日期兜底。确保 next.config.js 中设置 output: 'export' 和 images: { unoptimized: true }，将 out 目录发布到 GitHub Pages。"

## 6. 进阶建议

- **代码高亮**：在 remark 处理链中加入 `rehype-shiki`，构建时静态渲染代码块，无运行时 JS 开销。
- **SEO 模块**：在 core 逻辑中，根据 siteConfig 的作者信息自动生成 JSON-LD 结构化数据和 Open Graph meta 标签。
- **RSS/Sitemap**：在 `prebuild` 阶段同步生成 `public/rss.xml` 和 `public/sitemap.xml`。
- **Git 时间戳扩展**：若需要精确的 Git 首次提交时间作为"创建日期"，可在 prebuild 脚本中通过 `child_process` 调用 `git log --diff-filter=A --follow -1 --format="%aI" -- <file>` 获取，并注入到文章元数据。
- **多语言**：如果未来需要，可以在 siteConfig 中增加 `locales` 列表，并根据此生成不同的路由前缀。

---

下一步行动建议：
你准备好开始第一步了吗？可以先为你生成标准的 `src/core/config.ts` 模板和对应的 TypeScript 类型定义代码。
