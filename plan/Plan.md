# Walle 执行计划

> 按顺序将各阶段的指令块发送给 AI，每完成一步后进行验证再继续下一步。

---

## Phase 1 — 项目初始化与配置层

**目标**：搭建可运行的 Next.js 骨架，建立类型安全的全局配置。

**验收标准**：`npm run dev` 可启动，访问首页不报错，`siteConfig` 可在 Layout 中正常读取。

---

### Step 1.1 初始化项目

```prompt
使用 Next.js 14 App Router 初始化项目（TypeScript，Tailwind CSS）。
配置 next.config.js：
  - output: 'export'
  - images: { unoptimized: true }
安装以下依赖：gray-matter, remark, remark-rehype, rehype, rehype-highlight, rehype-stringify, date-fns, fuse.js
安装以下开发依赖：tsx
```

---

### Step 1.2 全局配置文件

```prompt
创建 src/core/config.ts，以 TypeScript 对象导出 siteConfig，包含以下字段：
  - title: string        // 网站标题
  - description: string  // 网站描述
  - author: string       // 作者名
  - theme: string        // 当前主题名，默认 'base'
  - postsPerPage: number // 每页文章数，默认 10
  - features: {
      search: boolean    // 是否启用搜索
      calendar: boolean  // 是否启用日历
    }

同时导出 SiteConfig 类型（使用 typeof siteConfig）。

在 src/app/layout.tsx 的全局 Layout 中引入 siteConfig，将 title 和 description 写入 metadata。
```

---

### Step 1.3 TypeScript 类型定义

```prompt
创建 src/core/types/index.ts，定义以下类型：

Post {
  slug: string
  title: string
  date: string        // ISO 8601 格式
  summary: string
  tags: string[]
  content: string     // 渲染后的 HTML
  rawContent: string  // 原始 Markdown
}

GroupedArchive {
  year: number
  posts: Pick<Post, 'slug' | 'title' | 'date'>[]
}

SearchIndexItem {
  slug: string
  title: string
  summary: string
  tags: string[]
  date: string
}
```

---

## Phase 2 — 内容解析层

**目标**：实现文章读取、解析、排序与归档的完整数据管线。

**验收标准**：`getAllPosts()` 能正确返回按日期排序的文章列表，`getPostBySlug()` 能返回渲染后的 HTML。

---

### Step 2.1 文章解析器

```prompt
创建 src/core/lib/posts.ts，实现以下函数：

1. resolvePostDate(frontmatterDate, filePath): Date
   优先级：Frontmatter date 字段 > 文件系统 mtime
   注意：日期字符串需用 new Date() 解析，确保跨时区一致性。

2. getAllPosts(): Post[]
   - 读取 content/posts/ 下所有 .md 文件
   - 使用 gray-matter 解析 Frontmatter
   - 使用 remark + remark-rehype + rehype-highlight + rehype-stringify 渲染 Markdown 为 HTML（含代码高亮）
   - summary 缺失时取 rawContent 前 200 字
   - 按 date 降序排列

3. getPostBySlug(slug: string): Post | null
   从 getAllPosts() 结果中按 slug 查找并返回。

4. getGroupedArchives(): GroupedArchive[]
   将 getAllPosts() 按年份分组，每组内按日期降序。

5. getPaginatedPosts(page: number): { posts: Post[], total: number, totalPages: number }
   使用 siteConfig.postsPerPage 分页。

所有函数均为纯函数，数据获取使用 Node.js fs 模块（仅在服务端/构建时调用）。
```

---

## Phase 3 — 视图层：基础主题

**目标**：构建完整的 base 主题组件集，支持 CSS 变量换肤。

**验收标准**：首页、文章页、归档页可正常渲染，切换 CSS 变量后颜色随之变化。

---

### Step 3.1 Tailwind CSS 变量配置

```prompt
在 src/app/globals.css 中定义 CSS 变量主题系统：

:root {
  --color-primary: ...
  --color-secondary: ...
  --color-background: ...
  --color-surface: ...
  --color-text: ...
  --color-text-muted: ...
  --color-border: ...
}

在 tailwind.config.ts 中将以上变量映射为 Tailwind 语义色（如 text-primary, bg-surface）。
后续所有组件仅使用语义色，禁止硬编码颜色值。
```

---

### Step 3.2 基础主题组件

```prompt
在 src/themes/base/ 目录下创建以下组件，所有颜色使用 Step 3.1 定义的语义色：

1. Navbar.tsx
   - 显示 siteConfig.title
   - 包含导航链接：首页、归档
   - 若 siteConfig.features.search 为 true，显示搜索图标按钮（点击触发搜索弹窗）

2. PostCard.tsx
   - Props: Pick<Post, 'slug' | 'title' | 'date' | 'summary' | 'tags'>
   - 显示标题（链接至 /posts/[slug]）、日期、摘要、标签列表

3. ArchiveList.tsx
   - Props: GroupedArchive[]
   - 按年份分组展示，每条显示日期和标题链接

4. Calendar.tsx
   - Props: { year: number, month: number, activeDates: string[] }
   - 渲染当月日历网格，activeDates 中的日期高亮显示
   - 若 siteConfig.features.calendar 为 false，返回 null

5. Pagination.tsx
   - Props: { current: number, total: number, basePath: string }
   - 生成上一页/下一页链接
```

---

## Phase 4 — 运行时主题解析器

**目标**：实现基于 `next/dynamic` 的运行时主题组件加载，支持 Fallback 到 base 主题。

**验收标准**：将 config.ts 中 theme 改为一个不存在的主题名，页面仍能正常渲染（Fallback 到 base）。

---

### Step 4.1 ThemeResolver

```prompt
创建 src/core/ThemeResolver.tsx。

实现 resolveComponent(componentName: string) 函数：
  - 使用 next/dynamic 动态导入 src/themes/${siteConfig.theme}/${componentName}
  - 通过 .catch() 在导入失败时自动 Fallback 到 src/themes/base/${componentName}
  - 返回可直接使用的 React 组件

实现以下具名导出，方便页面直接使用：
  export const ThemedNavbar = resolveComponent('Navbar');
  export const ThemedPostCard = resolveComponent('PostCard');
  export const ThemedArchiveList = resolveComponent('ArchiveList');
  export const ThemedCalendar = resolveComponent('Calendar');
  export const ThemedPagination = resolveComponent('Pagination');

注意：纯客户端交互组件（如搜索弹窗）使用 { ssr: false } 选项。
```

---

### Step 4.2 路由页面

```prompt
使用 ThemeResolver 中导出的 Themed* 组件，创建以下页面：

1. src/app/layout.tsx
   - 引入 ThemedNavbar，作为全站顶部导航
   - 设置 metadata（来自 siteConfig）

2. src/app/page.tsx（首页）
   - 调用 getPaginatedPosts(1) 获取第一页数据
   - 使用 ThemedPostCard 渲染文章列表
   - 使用 ThemedPagination 渲染分页

3. src/app/posts/[slug]/page.tsx（文章详情页）
   - 调用 getPostBySlug(slug) 获取文章
   - 渲染文章标题、日期、标签、HTML 内容
   - 使用 generateStaticParams() 预生成所有文章路径

4. src/app/archives/page.tsx（归档页）
   - 调用 getGroupedArchives() 获取归档数据
   - 使用 ThemedArchiveList 渲染
   - 右侧或底部展示 ThemedCalendar（当前月份，命中日期高亮）

5. src/app/posts/page/[page]/page.tsx（分页页面）
   - 支持 /posts/page/2、/posts/page/3 等路径
   - 使用 generateStaticParams() 预生成所有分页路径
```

---

## Phase 5 — 搜索功能

**目标**：构建时生成搜索索引，客户端懒加载实现模糊搜索。

**验收标准**：`npm run build` 后 `public/search-index.json` 存在且内容正确；搜索弹窗可正常检索文章。

---

### Step 5.1 搜索索引生成脚本

```prompt
创建 scripts/build-search-index.ts：
  - 调用 getAllPosts() 获取全部文章
  - 提取 SearchIndexItem 字段：slug, title, summary, tags, date
  - 将数组序列化为 JSON，写入 public/search-index.json

在 package.json 中配置：
  "prebuild": "tsx scripts/build-search-index.ts"

确保 prebuild 在 next build 之前自动执行。
```

---

### Step 5.2 搜索弹窗组件

```prompt
在 src/themes/base/ 下创建 SearchModal.tsx：
  - 使用 next/dynamic + { ssr: false } 导入（纯客户端组件）
  - 首次打开时 fetch('/search-index.json') 并初始化 Fuse.js 实例
  - Fuse.js 搜索字段：title（权重 0.6）、summary（权重 0.3）、tags（权重 0.1）
  - 输入框实时搜索，结果列表显示标题、日期、摘要片段
  - 点击结果跳转至对应文章页
  - 按 Escape 或点击遮罩关闭弹窗
  - 整个组件受 siteConfig.features.search 控制，关闭时不挂载
```

---

## Phase 6 — 自动化部署

**目标**：GitHub Actions 在推送时自动构建并部署至 GitHub Pages。

**验收标准**：推送 Markdown 文件到 main 分支后，GitHub Pages 自动更新。

---

### Step 6.1 GitHub Actions 部署脚本

```prompt
创建 .github/workflows/deploy.yml：

触发条件：push 到 main 分支

步骤：
  1. actions/checkout@v4，配置 fetch-depth: 0（保留 Git 历史，支持日期兜底）
  2. actions/setup-node@v4，Node.js 20，启用 npm 缓存
  3. npm ci
  4. npm run build（自动触发 prebuild 生成搜索索引）
  5. actions/upload-pages-artifact@v3，上传 out 目录
  6. actions/deploy-pages@v4，部署至 GitHub Pages

同时在 GitHub 仓库 Settings > Pages 中配置 Source 为 GitHub Actions。
```

---

## Phase 7 — 进阶扩展（可选）

以下功能按需实现，不阻塞主流程。

---

### Step 7.1 RSS 与 Sitemap

```prompt
在 scripts/build-search-index.ts 的同一脚本中（或新建 scripts/build-meta.ts），
额外生成：
  - public/rss.xml：包含所有文章的标准 RSS 2.0 格式
  - public/sitemap.xml：包含所有文章页和归档页的 URL

将脚本加入 prebuild 钩子。
```

---

### Step 7.2 SEO 结构化数据

```prompt
在 src/app/posts/[slug]/page.tsx 中，
根据文章数据和 siteConfig 生成 JSON-LD 结构化数据（Article 类型），
通过 <script type="application/ld+json"> 注入 <head>。
同时为文章页生成完整的 Open Graph meta 标签。
```

---

### Step 7.3 Git 时间戳扩展

```prompt
在 src/core/lib/posts.ts 的 resolvePostDate 函数中，
新增 Git 时间戳支持：
  - 使用 child_process.execSync 调用
    git log --diff-filter=A --follow -1 --format="%aI" -- <filePath>
  - 仅在 Frontmatter date 缺失时尝试此方法
  - 命令执行失败时静默回退到文件 mtime
  - 在非 Git 环境（如本地无 Git 历史）下需做 try/catch 保护
```

---

## 实施顺序总览

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
                                                      ↓
                                              Phase 7（按需）
```

每个 Phase 完成后运行 `npm run dev` 验证，Phase 6 完成后推送至 GitHub 验证自动部署。
