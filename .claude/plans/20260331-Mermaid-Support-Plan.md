# Mermaid 图表支持

## Context

用户希望在 Markdown 文章中支持 Mermaid 图表语法（流程图、序列图等）。当前渲染管线仅有 remark-gfm + rehype-highlight，mermaid 代码块会被当作普通代码处理。

选用 `beautiful-mermaid`：零 DOM 依赖、纯 Node.js 同步渲染为 SVG、支持 CSS 变量实时主题切换，完全兼容 `output: 'export'` 静态导出。

## 变更内容

### Task 1 — 安装 beautiful-mermaid

```bash
npm install beautiful-mermaid
```

### Task 2 — 编写 rehypeMermaid 自定义插件

**文件**: `src/core/lib/posts.ts`

新增 `rehypeMermaid` rehype 插件：
- 遍历 `<pre><code class="language-mermaid">` 节点
- 调用 `renderMermaidSVG(text, { transparent: true, padding: 24 })` 渲染单个 SVG
- 将 `<pre>` 替换为 `<div class="mermaid-diagram">` 包裹的 raw SVG
- 渲染失败时 fallback 保留原始代码块

插件顺序：必须在 `rehypeHighlight` **之前**，避免 highlight.js 尝试处理 mermaid 代码块。

`rehypeStringify` 需加 `{ allowDangerousHtml: true }` 以输出 raw SVG 节点。

**主题适配原理**：`beautiful-mermaid` 输出的 SVG 内部使用 CSS 变量（`--bg`、`--fg`、`--accent`、`--surface`、`--border`、`--muted`），在 CSS 中用 `!important` 将其映射到项目语义色彩变量，一套规则自动适配所有 scheme 和亮/暗模式，无需渲染多套 SVG。

### Task 3 — 添加样式

**文件**: `app/globals.css`（追加）

```css
/* ── Mermaid 图表 ─────────────────────────────── */
.mermaid-diagram {
  width: fit-content;
  max-width: 100%;
  overflow-x: auto;
  margin: 1.5em auto;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 1rem;
  background: var(--color-surface);
}
.mermaid-diagram svg {
  max-width: 100%;
  height: auto;
  --bg:      var(--color-surface) !important;
  --fg:      var(--color-text) !important;
  --accent:  var(--color-primary) !important;
  --surface: var(--color-background) !important;
  --border:  var(--color-border) !important;
  --muted:   var(--color-text-muted) !important;
}
```

- `width: fit-content`：卡片宽度收缩到 SVG 实际尺寸，避免卡片远大于图表
- `margin: 1.5em auto`：居中显示
- CSS 变量映射：`--color-*` 变量已在各 scheme CSS 中按主题定义，自动适配

## 关键文件

| 文件 | 改动 |
|:---|:---|
| `package.json` | 新增依赖 `beautiful-mermaid` |
| `src/core/lib/posts.ts` | 新增 `rehypeMermaid` 插件 + 调整插件顺序 + `allowDangerousHtml` |
| `app/globals.css` | 追加 `.mermaid-diagram` 样式 |

## 状态

已完成（2026-03-31）

---

## Bugfix — ESM/CJS 兼容性（2026-03-31）

### 问题

CI 构建在 `prebuild` 阶段报错：

```
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: No "exports" main defined in
.../node_modules/beautiful-mermaid/package.json
```

### 根因

`beautiful-mermaid` v1.1.3 是 ESM-only 包，`exports` 只有 `"bun"` 和 `"import"` 条件，没有 `"require"` 条件。`tsx` 在 CJS 模式下将静态 `import` 语句转译为 `require()`，Node.js 找不到匹配的导出条件，在模块加载时即崩溃。

### 修复

**文件**：`src/core/lib/posts.ts`

1. 删除顶层静态 `import { renderMermaidSVG } from 'beautiful-mermaid'`
2. `rehypeMermaid` transformer 改为 `async`，内部改用 `await import('beautiful-mermaid')` 懒加载

动态 `import()` 始终以 ESM 方式解析，即使调用方处于 CJS 上下文，因此正确匹配包的 `"import"` 导出条件。额外优化：无 mermaid 节点时提前返回，完全跳过 import。
