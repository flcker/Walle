# 内容与文章规则

## Frontmatter 规范

文章文件位于 `content/posts/`，文件名即为 URL slug。

```markdown
---
title: 文章标题（必填）
date: 2026-03-24         # 推荐填写，ISO 8601 格式
summary: 摘要文字         # 可选，未填写则取正文前 200 字
tags: [tag1, tag2]       # 可选
---

正文内容...
```

### 日期回退策略
1. Frontmatter `date` 字段（优先）
2. 文件系统 mtime（兜底）

> Git 提交时间戳为可选扩展功能（Phase 7），当前版本不支持。

## 文章解析规则

- 所有文章读取和解析逻辑集中在 `src/core/lib/posts.ts`
- 页面组件**禁止**直接使用 `fs`、`path` 读取 `content/posts/`
- 可用的数据访问函数：
  - `getAllPosts()` — 获取所有文章（按日期降序）
  - `getPostBySlug(slug)` — 获取单篇文章（含 HTML 内容）
  - `getGroupedArchives()` — 获取按年份分组的归档
  - `getPaginatedPosts(page)` — 分页获取文章列表

## Markdown 渲染管线

```
gray-matter（解析 Frontmatter）
  → remark（处理 Markdown AST）
  → remark-rehype（转换为 HTML AST）
  → rehype-highlight（代码块语法高亮）
  → rehype-stringify（输出 HTML 字符串）
```

- 代码高亮使用 `rehype-highlight`（基于 highlight.js）
- 高亮样式在 `app/layout.tsx` 中导入 `highlight.js/styles/github.css`
- **禁止**引入 `rehype-shiki` 或其他代码高亮库替代，会有 ESM 兼容性问题

## 搜索索引

- 索引文件：`public/search-index.json`
- 生成时机：`npm run build` 前自动执行 `prebuild` 钩子
- 索引字段对应 `SearchIndexItem` 类型：`slug`、`title`、`summary`、`tags`、`date`
- 修改 `SearchIndexItem` 类型时，同步更新 `scripts/build-search-index.ts`
