# Walle 项目开发规则

Walle（瓦力）是基于 Next.js 14 的静态博客系统，专注于极简配置、主题自由和开箱即用。

## 关键约定

### 配置管理
- 所有站点配置集中在 `src/core/config.ts`，使用 `as const` 保证字面类型
- **禁止**在组件内硬编码站点名称、功能开关等配置值，统一从 `siteConfig` 读取
- 功能开关（`siteConfig.features.*`）控制 UI 元素的显示，组件内必须检查后再渲染

### 类型定义
- 所有跨文件共用类型定义在 `src/core/types/index.ts`
- 主题组件 Props 类型必须在此文件定义，供 `ThemeResolver.tsx` 的 `dynamic<T>()` 泛型使用
- 禁止在组件文件中重复定义已存在于 `types/index.ts` 的接口

### 主题系统
- `src/themes/base/` 是完整默认主题，包含所有组件的完整实现
- 自定义主题放在 `src/themes/<theme-name>/`，只需放置**差异化组件**，其余自动继承 base
- 主题组件统一通过 `src/core/ThemeResolver.tsx` 导出，命名格式 `Themed<ComponentName>`
- 新增主题组件时：① 在 `types/index.ts` 定义 Props 类型 ② 在 `ThemeResolver.tsx` 注册 ③ 在 `base/` 实现默认版本

### Server / Client 组件边界
- 页面和布局组件默认为 Server Component
- 需要状态、事件处理的部分拆分为独立的 `*Client.tsx` 文件并标注 `"use client"`
- 搜索弹窗等重型客户端组件必须通过 `dynamic({ ssr: false })` 懒加载

### 样式规范
- 使用 Tailwind CSS 语义色彩类（`bg-background`、`text-primary`、`border-border` 等）
- **禁止**使用 Tailwind 原始色值（`bg-gray-100`、`text-blue-500` 等），统一用 CSS 变量驱动
- 色彩变量定义在 `app/globals.css`，自动支持 `prefers-color-scheme` 深色模式
- 布局约束：内容区最大宽度 `max-w-3xl`，水平内边距 `px-4`

### 文章系统
- 文章放在 `content/posts/` 目录，文件名即 slug
- 日期优先级：Frontmatter `date` > 文件 mtime
- 文章解析逻辑集中在 `src/core/lib/posts.ts`，禁止在页面组件中直接操作文件系统

### 搜索索引
- 搜索索引 `public/search-index.json` 在构建时由 `scripts/build-search-index.ts` 生成
- 通过 `package.json` 的 `prebuild` 钩子自动触发，无需手动执行
- 修改文章解析逻辑时同步确认索引字段（`SearchIndexItem` 类型）

## 开发命令

```bash
npm run dev      # 本地开发（不生成搜索索引）
npm run build    # 构建（自动执行 prebuild 生成索引）
npm run lint     # ESLint 检查
```

## 文件结构速查

```
src/core/config.ts          # 站点配置（唯一真相来源）
src/core/types/index.ts     # 所有共用 TypeScript 类型
src/core/lib/posts.ts       # 文章解析 & 数据访问层
src/core/ThemeResolver.tsx  # 主题组件动态加载注册表
src/themes/base/            # 默认主题完整实现
app/                        # Next.js App Router 页面
content/posts/              # Markdown 文章
scripts/                    # 构建脚本
doc/Develop.md              # 完整开发文档（实现细节、技术决策）
plan/Plan.md                # 分阶段执行计划
```

## 规则文件

| 文件 | 内容 |
|:---|:---|
| `.claude/rules/theme.md` | 主题系统：如何注册新组件、创建自定义主题 |
| `.claude/rules/content.md` | 文章 Frontmatter 规范、解析管线、搜索索引 |
| `.claude/rules/style.md` | 色彩系统、布局约束、交互状态规范 |
| `.claude/rules/nextjs.md` | Server/Client 组件边界、路由结构、静态生成要求 |
| `.claude/rules/deployment.md` | GitHub Actions 部署流程、basePath 配置 |

## 项目文档

完整的实现细节、技术决策记录和部署说明见 `doc/Develop.md`。
