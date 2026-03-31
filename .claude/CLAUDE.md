# Walle 项目开发规则

Walle（瓦力）是基于 Next.js 14 的静态博客系统，专注于极简配置、主题自由和开箱即用。

## 关键约定

### 配置管理
- 所有站点配置集中在 `src/core/config.ts`，使用 `as const` 保证字面类型
- **禁止**在组件内硬编码站点名称、功能开关等配置值，统一从 `siteConfig` 读取
- 功能开关（`siteConfig.features.*`）控制 UI 元素的显示，组件内必须检查后再渲染
- `siteConfig.profile.show` 控制个人信息模块的显示位置：`'header-banner'`（导航栏上方横幅）、`'header-inline'`（导航栏内嵌）、`'home-top'`（首页顶部卡片）、`'home-bottom'`（首页底部卡片）、`false`（不显示）
- 头像等站点资源放在 `content/assets/`，配置中使用 `/assets/文件名` 格式的 public URL

### 类型定义
- 所有跨文件共用类型定义在 `src/core/types/index.ts`
- 主题组件 Props 类型必须在此文件定义，供 `ThemeResolver.tsx` 的 `dynamic<T>()` 泛型使用
- 禁止在组件文件中重复定义已存在于 `types/index.ts` 的接口

### 主题系统
- `src/themes/base/` 是完整默认主题，包含所有组件的完整实现
- 自定义主题放在 `src/themes/<theme-name>/`，只需放置**差异化组件**和/或 `theme.css`，其余自动继承 base
- 主题组件统一通过 `src/core/ThemeResolver.tsx` 导出，命名格式 `Themed<ComponentName>`
- 新增主题组件时：① 在 `types/index.ts` 定义 Props 类型 ② 在 `ThemeResolver.tsx` 注册 ③ 在 `base/` 实现默认版本
- **主题 CSS（颜色变量、动画、特效类）放在 `src/themes/<name>/theme.css`**，由 `ThemeGlobalStyles` Server Component 自动注入，切换主题不需要修改 `app/` 目录
- 支持多配色方案：在 `src/themes/<name>/schemes/` 下放置 `<scheme>.css`，通过 `siteConfig.themeOptions.colorScheme` 一行切换；`ThemeGlobalStyles` 自动合并 `schemes/{colorScheme}.css` + `theme.css` 注入
- 详细步骤见 `.claude/rules/theme.md`

### Server / Client 组件边界
- 页面和布局组件默认为 Server Component
- 需要状态、事件处理的部分拆分为独立的 `*Client.tsx` 文件并标注 `"use client"`
- 搜索弹窗等重型客户端组件必须通过 `dynamic({ ssr: false })` 懒加载
- 详细规范见 `.claude/rules/nextjs.md`

### 样式规范
- 使用 Tailwind CSS 语义色彩类（`bg-background`、`text-primary`、`border-border` 等）
- **禁止**使用 Tailwind 原始色值（`bg-gray-100`、`text-blue-500` 等），统一用 CSS 变量驱动
- 布局约束：内容区最大宽度 `max-w-3xl`，水平内边距 `px-4`
- 文章正文排版使用 `@tailwindcss/typography`，`<article>` 固定类名 `prose prose-neutral max-w-none dark:prose-invert`
- 完整色彩表、排版规范和交互状态规范见 `.claude/rules/style.md`

### 暗色模式 / 主题切换
- 暗色主题通过 `<html data-theme="dark">` 属性驱动，CSS 变量块同时响应 `@media (prefers-color-scheme: dark)` 和 `[data-theme="dark"]`
- `tailwind.config.ts` 使用 `darkMode: ['selector', '[data-theme="dark"]']`，`dark:` 前缀类随属性切换
- 切换逻辑封装在 `src/core/lib/useTheme.ts`，组件通过该 Hook 读取/切换主题
- `app/layout.tsx` 的 `<head>` 中有阻塞式内联脚本，防止首次加载主题闪烁（FOUC）
- **禁止**在组件中直接操作 `document.documentElement` 属性或 `localStorage`，统一通过 `useTheme`

### 文章系统
- 文章放在 `content/posts/` 目录，文件名即 slug，**不支持子目录**
- 日期优先级：Frontmatter `date` > 文件 mtime
- 文章解析逻辑集中在 `src/core/lib/posts.ts`，禁止在页面组件中直接操作文件系统
- Frontmatter 规范、解析管线、数据访问函数列表见 `.claude/rules/content.md`

### 图片系统
- 所有图片资源（文章图片、站点头像等）统一放在 `content/assets/`，**支持任意子目录**
- `npm run build` 的 prebuild 阶段自动将 `content/assets/` 递归同步到 `public/assets/`
- 本地 `npm run dev` 不自动同步，新增图片后需先执行 `npm run prebuild`

**Markdown 文章图片**：
- 使用相对路径引用：`![说明](../assets/图片名.png)`
- `rehypeAssetPath` 插件在构建时将路径规范化并补全 basePath
- **禁止**在 Markdown 中写 `/assets/` 绝对路径（编辑器无法预览）

**站点资源（头像等）**：
- 在 `siteConfig` 中使用 `/assets/文件名` 格式的 public URL（如 `profile.avatar: '/assets/avatar.svg'`）
- 禁止使用 `content/assets/` 路径（该路径不在 public 目录下，浏览器无法访问）

## 开发命令

```bash
npm run dev      # 本地开发（不执行 prebuild，不同步图片/索引）
npm run prebuild # 手动生成搜索索引 + 同步 content/assets/ → public/assets/
npm run build    # 构建（自动执行 prebuild）
npm run lint     # ESLint 检查
```

## 文件结构速查

```
src/core/config.ts              # 站点配置（唯一真相来源）
src/core/types/index.ts         # 所有共用 TypeScript 类型
src/core/lib/posts.ts           # 文章解析 & 数据访问层（含 rehypeAssetPath 插件）
src/core/lib/useTheme.ts        # 主题切换 Hook（localStorage + data-theme 属性）
src/core/ThemeResolver.tsx      # 主题组件动态加载注册表
src/core/ThemeGlobalStyles.tsx  # 主题 CSS 注入 Server Component
src/themes/base/                # 默认主题完整实现
  ├── Navbar.tsx                #   导航栏（含 header-inline / header-banner Profile 模式）
  ├── Footer.tsx                #   页脚（版权信息）
  └── Profile.tsx               #   个人信息卡片（home-top / home-bottom 模式）
src/themes/liquid-glass/        # Liquid Glass 主题（当前激活）
  ├── theme.css                 #   结构 CSS（blob 动画关键帧 + 玻璃卡片结构，无颜色）
  ├── schemes/                  #   配色方案（每套独立 CSS 文件）
  │   ├── aurora.css            #     靛蓝极光（默认）
  │   ├── sunset.css            #     日落珊瑚
  │   ├── ocean.css             #     深海蓝绿
  │   └── rose.css              #     玫瑰粉
  ├── Navbar.tsx / PostCard.tsx / Footer.tsx / Profile.tsx
app/                            # Next.js App Router 页面
content/posts/                  # Markdown 文章（平铺，不含子目录）
content/assets/                 # 图片资源（支持子目录，构建时同步到 public/assets/）
scripts/                        # 构建脚本（搜索索引 + 图片同步）
doc/Develop.md                  # 完整开发文档（实现细节、技术决策）
plan/                           # 分阶段执行计划（每个功能独立文件，禁止覆盖）
```

## 规则文件

| 文件 | 内容 |
|:---|:---|
| `.claude/rules/theme.md` | 主题系统：如何注册新组件、创建自定义主题 |
| `.claude/rules/content.md` | 文章 Frontmatter 规范、解析管线、搜索索引 |
| `.claude/rules/style.md` | 色彩系统、布局约束、交互状态规范 |
| `.claude/rules/nextjs.md` | Server/Client 组件边界、路由结构、静态生成要求 |
| `.claude/rules/deployment.md` | GitHub Actions 部署流程、basePath 配置 |

## 计划文档

- 所有计划文档统一放在 `plan/` 目录下
- 新建文件时使用**功能名 + 日期**的方式命名，格式：`YYYYMMDD-<功能名>-Plan.md`（例：`20260324-TagsAndCategories-Plan.md`）
- **禁止**覆盖 `plan/` 目录下已有文件，每次新建独立文件

## 项目文档

完整的实现细节和技术决策记录见 `doc/Develop.md`；部署规范见 `.claude/rules/deployment.md`。

## Project Context

> 此章节记录项目当前状态，每次功能迭代后同步更新。

### 已实现功能

| 功能 | 路由 / 文件 | 状态 |
|:---|:---|:---|
| 文章列表（分页） | `app/page.tsx`、`app/posts/page/[page]/page.tsx` | ✅ 完成 |
| 文章详情 | `app/posts/[slug]/page.tsx` | ✅ 完成 |
| 归档（按年分组 + 日历） | `app/archives/page.tsx` | ✅ 完成 |
| 客户端全文搜索 | `NavbarClient.tsx` + `SearchModal.tsx` | ✅ 完成 |
| 分类列表 & 过滤页 | `app/categories/` | ✅ 完成 |
| 标签列表 & 过滤页 | `app/tags/` | ✅ 完成 |
| 文章图片支持 | `content/assets/` + `src/core/lib/posts.ts` | ✅ 完成 |
| Footer（版权信息） | `app/layout.tsx` + `src/themes/base/Footer.tsx` | ✅ 完成 |
| Profile 模块（个人信息 + 社交链接） | `src/themes/base/Profile.tsx` + `Navbar.tsx` | ✅ 完成 |
| 日/夜主题切换 | `src/core/lib/useTheme.ts` + `NavbarClient.tsx` | ✅ 完成 |
| Liquid Glass 主题 | `src/themes/liquid-glass/` + `src/core/ThemeGlobalStyles.tsx` | ✅ 完成 |

### 数据模型（当前版本）

`Post` 接口字段：`slug` `title` `date` `summary` `tags: string[]` `category: string` `content` `rawContent`

> Frontmatter 完整规范见 `.claude/rules/content.md`。

### 主题组件注册表（当前）

| 导出名 | Props 类型 | base 实现 |
|:---|:---|:---|
| `ThemedNavbar` | — | `Navbar.tsx` |
| `ThemedPostCard` | `PostCardProps` | `PostCard.tsx` |
| `ThemedArchiveList` | `ArchiveListProps` | `ArchiveList.tsx` |
| `ThemedCalendar` | `CalendarProps` | `Calendar.tsx` |
| `ThemedPagination` | `PaginationProps` | `Pagination.tsx` |
| `ThemedTagList` | `TagListProps` | `TagList.tsx` |
| `ThemedCategoryList` | `CategoryListProps` | `CategoryList.tsx` |
| `ThemedFooter` | `FooterProps` | `Footer.tsx` |
| `ThemedProfile` | `ProfileProps` | `Profile.tsx` |

### 路由结构（当前）

```
app/
├── page.tsx                              # 首页（第 1 页）
├── posts/
│   ├── [slug]/page.tsx                   # 文章详情
│   └── page/[page]/page.tsx              # 文章分页
├── archives/page.tsx                     # 归档
├── categories/
│   ├── page.tsx                          # 分类列表
│   └── [category]/
│       ├── page.tsx                      # 分类文章（第 1 页）
│       └── page/[page]/page.tsx          # 分类文章分页
└── tags/
    ├── page.tsx                          # 标签列表
    └── [tag]/
        ├── page.tsx                      # 标签文章（第 1 页）
        └── page/[page]/page.tsx          # 标签文章分页
```

### 配置速查（`siteConfig`）

| 字段 | 说明 |
|:---|:---|
| `footer.copyright` | Footer 版权归属名 |
| `profile.show` | Profile 显示位置（见配置管理节） |
| `profile.avatar` | 头像 URL（`/assets/` 前缀） |
| `profile.github` / `weibo` / `rss` | 社交链接，留空不显示 |
| `features.themeToggle` | 是否显示日/夜切换按钮（默认 `true`） |
| `themeOptions.colorScheme` | 配色方案（liquid-glass 主题）：`'aurora'`（靛蓝极光）\| `'sunset'`（日落珊瑚）\| `'ocean'`（深海蓝绿）\| `'rose'`（玫瑰粉） |

### 待开发（计划中）

- Phase 5：RSS Feed
- Phase 6：sitemap.xml
- Phase 7：文章首次提交时间作为日期回退
