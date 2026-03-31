1# GFM Markdown 语法支持

## Context

`hello-walle.md` 中使用了三类 GFM（GitHub Flavored Markdown）扩展语法：**删除线**、**任务列表**、**表格**。当前渲染管线缺少 `remark-gfm` 插件，导致这三类语法无法正确解析，直接渲染为乱码或纯文本。

目标：为系统补全完整 GFM 支持，并确保这三类元素在亮色/暗色模式下样式美观、与现有 prose 体系一致。

## 变更内容

### Task 1 — 安装 `remark-gfm`

```bash
npm install remark-gfm
```

remark-gfm v4 与当前 remark v15 完全兼容。

### Task 2 — 在渲染管线中启用 GFM 插件

**文件**: `src/core/lib/posts.ts`

`remark-gfm` 必须在 `remark-rehype` 之前注册（扩展 Markdown AST 层，而非 HTML AST 层）：

```typescript
import remarkGfm from 'remark-gfm';

const result = await remark()
  .use(remarkGfm)       // ← 新增
  .use(remarkRehype)
  .use(rehypeHighlight)
  .use(rehypeAssetPath(basePath))
  .use(rehypeStringify)
  .process(content);
```

### Task 3 — 添加任务列表 CSS 样式

**文件**: `app/globals.css`（末尾追加）

`remark-gfm` 生成的任务列表 HTML 结构：
```html
<ul class="contains-task-list">
  <li class="task-list-item">
    <input type="checkbox" disabled> 文字
  </li>
</ul>
```

自定义 checkbox 样式使用 `var(--color-border)` / `var(--color-primary)` 语义变量，自动适配亮/暗色模式和各配色方案。

**说明**：删除线无需额外样式（`@tailwindcss/typography` prose 已内置 `<del>` 的 `text-decoration: line-through`）；表格无需额外样式（prose 已内置，`tailwind.config.ts` 已配置 `--tw-prose-th-borders` / `--tw-prose-td-borders`）。

## 关键文件

| 文件 | 改动 |
|:---|:---|
| `package.json` | 新增依赖 `remark-gfm` |
| `src/core/lib/posts.ts` | 添加 `import remarkGfm` + `.use(remarkGfm)` |
| `app/globals.css` | 追加任务列表 CSS（~30 行） |

## 状态

已完成（2026-03-31）
