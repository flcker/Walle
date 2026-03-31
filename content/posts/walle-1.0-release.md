---
title: Walle 1.0 发布
date: 2026-03-31
summary: Walle 是基于 Next.js 14 的静态博客系统，专注于极简配置、主题自由和开箱即用。1.0 版本完整实现了从内容解析、主题系统到自动化部署的全套功能。
category: 公告
tags: [walle, release]
---

Walle（瓦力）1.0 正式发布。

Walle 是一个基于 Next.js 14 App Router 的静态博客系统，核心理念是**极简配置、主题自由、开箱即用**。所有站点信息集中在一个 TypeScript 配置文件中管理，主题可以随时切换，部署只需推送到 GitHub。

---

## Feature List

### 内容创作

- **Markdown 写作**：支持标准 Markdown 语法，Frontmatter 管理标题、日期、摘要、分类、标签
- **GitHub Flavored Markdown**：删除线 `~~text~~`、任务列表 `- [x]`、表格
- **代码块语法高亮**：基于 highlight.js，构建时静态生成，无运行时 JS，亮/暗模式自动切换配色
- **Mermaid 图表**：在 Markdown 中写 mermaid 代码块，构建时渲染为内联 SVG，自动适配当前配色
- **文章图片**：图片放 `content/assets/`，Markdown 用相对路径引用，本地编辑器可预览，构建自动处理路径

### 内容组织

- **标签与分类**：文章支持单个分类和多个标签，独立的标签云页和分类列表页，均支持分页
- **归档页**：按年份分组展示所有文章，可选月历视图
- **全文搜索**：Fuse.js 客户端模糊搜索，索引在构建时自动生成，支持按标题、摘要、标签检索，键盘导航（↑↓ 选择，Enter 跳转，Esc 关闭）

### 主题与视觉

- **主题系统**：运行时主题加载器（ThemeResolver），自定义主题只需新建目录，未覆盖的组件自动回退到 base 主题
- **Liquid Glass 主题**：iOS 26 液态玻璃风格，磨砂半透明卡片 + 折射光晕 + 多彩背景 blob 动画
- **4 套配色方案**：Aurora（靛蓝极光）、Sunset（日落珊瑚）、Ocean（深海蓝绿）、Rose（玫瑰粉），可在页面上实时切换，无需刷新
- **日/夜模式**：支持跟随系统偏好或手动强制切换，防止页面加载时的颜色闪烁（FOUC）
- **Profile 模块**：5 种显示位置可选（导航栏内嵌、导航栏上方横幅、首页顶部/底部卡片、不显示），支持头像、社交链接

### 工程与部署

- **零配置静态导出**：`output: 'export'`，构建产物为纯静态文件，可部署到任意静态托管平台
- **GitHub Actions 自动部署**：推送到 main 分支自动触发构建和 GitHub Pages 部署，支持子路径（basePath）自动注入
- **内容仓库分离**（可选）：将文章放独立仓库（可私有），内容更新通过 `repository_dispatch` 自动触发代码仓库重新构建
- **TypeScript 配置**：站点配置全部集中在 `src/core/config.ts`，类型安全，IDE 补全，无 YAML 依赖

---

## 技术栈

| 模块 | 方案 |
|:---|:---|
| 框架 | Next.js 14 App Router + TypeScript |
| 样式 | Tailwind CSS + CSS 自定义变量 |
| 内容解析 | gray-matter + remark + rehype |
| 代码高亮 | rehype-highlight（highlight.js） |
| 图表 | beautiful-mermaid（Node.js 同步渲染） |
| GFM | remark-gfm |
| 搜索 | Fuse.js |
| 部署 | GitHub Actions + GitHub Pages |

---

## 快速开始

修改 `src/core/config.ts` 填入站点信息，在 `content/posts/` 下新建 Markdown 文件，推送到 GitHub 即可上线。

```markdown
---
title: 第一篇文章
date: 2026-03-31
category: 随笔
tags: [hello]
---

正文内容...
```

详细文档见 [doc/Develop.md](https://github.com/flcker/Walle/blob/main/doc/Develop.md)。
