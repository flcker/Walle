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
- 详细步骤见 `.claude/rules/theme.md`

### Server / Client 组件边界
- 详细规范见 `.claude/rules/nextjs.md`

### 样式规范
- **禁止**使用 Tailwind 原始色值（`bg-gray-100`、`text-blue-500` 等），统一用语义色彩类（`bg-background`、`text-primary` 等）
- 完整色彩表、排版规范和交互状态规范见 `.claude/rules/style.md`

### 暗色模式 / 主题切换
- **禁止**在组件中直接操作 `document.documentElement` 属性或 `localStorage`，统一通过 `useColorScheme`（配色方案）或 `useTheme`（亮/暗模式）
- 详细规范见 `.claude/rules/style.md`

### 代码块高亮
- `app/layout.tsx` 全局引入 `highlight.js/styles/github.css` 作为所有主题的亮色兜底基础，**禁止**删除或替换此引入
- base 主题暗色兜底规则写在 `app/globals.css` 末尾（github-dark 风格），覆盖 `github.css` 的亮色 token
- liquid-glass 主题各 scheme.css 内含主题特色的 `.hljs-*` token 覆盖，选择器带 `html[data-color-scheme="xxx"]` 前缀，随配色方案自动切换
- **禁止**引入 `rehype-shiki` 或其他代码高亮库替代 `rehype-highlight`（ESM 兼容性问题）

### 文章系统
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
src/core/lib/useColorScheme.ts  # 配色方案切换 Hook（localStorage + data-color-scheme 属性）
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
  ├── Navbar.tsx / NavbarClient.tsx / PostCard.tsx / Footer.tsx / Profile.tsx
app/                            # Next.js App Router 页面
content/posts/                  # Markdown 文章（平铺，不含子目录）
content/assets/                 # 图片资源（支持子目录，构建时同步到 public/assets/）
scripts/                        # 构建脚本（搜索索引 + 图片同步）
doc/Develop.md                  # 完整开发文档（实现细节、技术决策）
.claude/plans/                  # 分阶段执行计划（每个功能独立文件，禁止覆盖）
```

## 规则文件

| 文件 | 内容 |
|:---|:---|
| `.claude/rules/theme.md` | 主题系统：如何注册新组件、创建自定义主题 |
| `.claude/rules/content.md` | 文章 Frontmatter 规范、解析管线、搜索索引 |
| `.claude/rules/style.md` | 色彩系统、布局约束、交互状态规范 |
| `.claude/rules/nextjs.md` | Server/Client 组件边界、路由结构、静态生成要求 |
| `.claude/rules/deployment.md` | GitHub Actions 部署流程、basePath 配置 |
| `.claude/rules/plan.md` | 计划文档命名规范、plan 模式执行规范 |

## 计划文档

详细规范见 `.claude/rules/plan.md`

## 项目文档

完整的实现细节和技术决策记录见 `doc/Develop.md`；部署规范见 `.claude/rules/deployment.md`。

## Project Context

> 此章节记录项目当前状态，每次功能迭代后同步更新。

### 数据模型
`Post` 接口字段见 `src/core/types/index.ts`；Frontmatter 规范见 `.claude/rules/content.md`。

### 配置速查（`siteConfig`）

| 字段 | 说明 |
|:---|:---|
| `footer.copyright` | Footer 版权归属名 |
| `profile.show` | Profile 显示位置（见配置管理节） |
| `profile.avatar` | 头像 URL（`/assets/` 前缀） |
| `profile.github` / `weibo` / `rss` | 社交链接，留空不显示 |
| `features.themeToggle` | 是否显示日/夜切换按钮（默认 `true`） |
| `themeOptions.colorScheme` | 配色方案（liquid-glass 主题）：`'aurora'`（靛蓝极光）\| `'sunset'`（日落珊瑚）\| `'ocean'`（深海蓝绿）\| `'rose'`（玫瑰粉） |
| `themeOptions.colorSchemes` | 可切换的配色方案列表（liquid-glass 主题）：`['aurora', 'sunset', 'ocean', 'rose']` |

### 已完成功能

- 代码块语法高亮：base 主题 github-dark 暗色兜底 + liquid-glass 各 scheme 专属 token 配色（`app/globals.css`、`schemes/*.css`）
- 配色方案运行时切换：`useColorScheme` Hook + `html[data-color-scheme]` 属性驱动 + Navbar 调色盘 UI（liquid-glass 主题专属）

### 待开发（计划中）

- Phase 5：RSS Feed
- Phase 6：sitemap.xml
- Phase 7：文章首次提交时间作为日期回退
