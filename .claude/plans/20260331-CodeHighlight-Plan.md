# Plan: 代码块样式支持（base + liquid-glass 双主题）

## 背景

`app/layout.tsx` 目前通过 `import "highlight.js/styles/github.css"` 全局引入固定的亮色代码高亮，
暗色模式下代码块背景依然是白色，各配色方案（aurora/sunset/ocean/rose）无差异。

目标：
- **base 主题**：在 `app/globals.css` 增加暗色 hljs 兜底规则（github-dark 色调），使 base 主题亮/暗均正确
- **liquid-glass**：每套 scheme.css 末尾追加 `.hljs-*` 覆盖规则，代码块颜色随配色方案各自变化，并自动跟随亮/暗模式

`layout.tsx` 中现有的 `github.css` import **保留不动**，作为所有主题的亮色兜底基础；
各 scheme.css 通过内联 `<style>` 后置注入（`ThemeGlobalStyles`），优先级可覆盖 bundle CSS。

---

## 文件变更清单

| 文件 | 变更 |
|:---|:---|
| `app/globals.css` | 末尾追加：base/兜底 暗色 hljs 规则 |
| `src/themes/liquid-glass/schemes/aurora.css` | 末尾追加：aurora 亮/暗 hljs 覆盖 |
| `src/themes/liquid-glass/schemes/sunset.css` | 末尾追加：sunset 亮/暗 hljs 覆盖 |
| `src/themes/liquid-glass/schemes/ocean.css` | 末尾追加：ocean 亮/暗 hljs 覆盖 |
| `src/themes/liquid-glass/schemes/rose.css` | 末尾追加：rose 亮/暗 hljs 覆盖 |

**不修改**：`app/layout.tsx`、`ThemeGlobalStyles.tsx`、任何 `.tsx/.ts` 文件

---

## 任务拆分（3 个 subagent 并行）

### Subagent A — `app/globals.css` 兜底暗色

在文件末尾追加 github-dark 风格暗色 hljs 规则，同时响应 `@media (prefers-color-scheme: dark)` 和 `[data-theme="dark"]`：

```css
/* ─── 代码块高亮兜底（暗色模式，base 主题 & 无 scheme 主题通用）──── */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .hljs {
    color: #c9d1d9;
    background: #161b22;
  }
  :root:not([data-theme="light"]) .hljs-doctag,
  :root:not([data-theme="light"]) .hljs-keyword,
  :root:not([data-theme="light"]) .hljs-meta .hljs-keyword,
  :root:not([data-theme="light"]) .hljs-template-tag,
  :root:not([data-theme="light"]) .hljs-template-variable,
  :root:not([data-theme="light"]) .hljs-type,
  :root:not([data-theme="light"]) .hljs-variable.language_ { color: #ff7b72; }
  :root:not([data-theme="light"]) .hljs-title,
  :root:not([data-theme="light"]) .hljs-title.class_,
  :root:not([data-theme="light"]) .hljs-title.class_.inherited__,
  :root:not([data-theme="light"]) .hljs-title.function_ { color: #d2a8ff; }
  :root:not([data-theme="light"]) .hljs-attr,
  :root:not([data-theme="light"]) .hljs-attribute,
  :root:not([data-theme="light"]) .hljs-literal,
  :root:not([data-theme="light"]) .hljs-meta,
  :root:not([data-theme="light"]) .hljs-number,
  :root:not([data-theme="light"]) .hljs-operator,
  :root:not([data-theme="light"]) .hljs-variable,
  :root:not([data-theme="light"]) .hljs-selector-attr,
  :root:not([data-theme="light"]) .hljs-selector-class,
  :root:not([data-theme="light"]) .hljs-selector-id { color: #79c0ff; }
  :root:not([data-theme="light"]) .hljs-regexp,
  :root:not([data-theme="light"]) .hljs-string,
  :root:not([data-theme="light"]) .hljs-meta .hljs-string { color: #a5d6ff; }
  :root:not([data-theme="light"]) .hljs-built_in,
  :root:not([data-theme="light"]) .hljs-symbol { color: #ffa657; }
  :root:not([data-theme="light"]) .hljs-comment,
  :root:not([data-theme="light"]) .hljs-code,
  :root:not([data-theme="light"]) .hljs-formula { color: #8b949e; }
  :root:not([data-theme="light"]) .hljs-name,
  :root:not([data-theme="light"]) .hljs-quote,
  :root:not([data-theme="light"]) .hljs-selector-tag,
  :root:not([data-theme="light"]) .hljs-selector-pseudo { color: #7ee787; }
  :root:not([data-theme="light"]) .hljs-section { color: #1f6feb; font-weight: bold; }
  :root:not([data-theme="light"]) .hljs-bullet { color: #f2cc60; }
  :root:not([data-theme="light"]) .hljs-addition { color: #aff5b4; background-color: #033a16; }
  :root:not([data-theme="light"]) .hljs-deletion { color: #ffdcd7; background-color: #67060c; }
}
[data-theme="dark"] .hljs {
  color: #c9d1d9;
  background: #161b22;
}
[data-theme="dark"] .hljs-doctag,
[data-theme="dark"] .hljs-keyword,
[data-theme="dark"] .hljs-meta .hljs-keyword,
[data-theme="dark"] .hljs-template-tag,
[data-theme="dark"] .hljs-template-variable,
[data-theme="dark"] .hljs-type,
[data-theme="dark"] .hljs-variable.language_ { color: #ff7b72; }
[data-theme="dark"] .hljs-title,
[data-theme="dark"] .hljs-title.class_,
[data-theme="dark"] .hljs-title.class_.inherited__,
[data-theme="dark"] .hljs-title.function_ { color: #d2a8ff; }
[data-theme="dark"] .hljs-attr,
[data-theme="dark"] .hljs-attribute,
[data-theme="dark"] .hljs-literal,
[data-theme="dark"] .hljs-meta,
[data-theme="dark"] .hljs-number,
[data-theme="dark"] .hljs-operator,
[data-theme="dark"] .hljs-variable,
[data-theme="dark"] .hljs-selector-attr,
[data-theme="dark"] .hljs-selector-class,
[data-theme="dark"] .hljs-selector-id { color: #79c0ff; }
[data-theme="dark"] .hljs-regexp,
[data-theme="dark"] .hljs-string,
[data-theme="dark"] .hljs-meta .hljs-string { color: #a5d6ff; }
[data-theme="dark"] .hljs-built_in,
[data-theme="dark"] .hljs-symbol { color: #ffa657; }
[data-theme="dark"] .hljs-comment,
[data-theme="dark"] .hljs-code,
[data-theme="dark"] .hljs-formula { color: #8b949e; }
[data-theme="dark"] .hljs-name,
[data-theme="dark"] .hljs-quote,
[data-theme="dark"] .hljs-selector-tag,
[data-theme="dark"] .hljs-selector-pseudo { color: #7ee787; }
[data-theme="dark"] .hljs-section { color: #1f6feb; font-weight: bold; }
[data-theme="dark"] .hljs-bullet { color: #f2cc60; }
[data-theme="dark"] .hljs-addition { color: #aff5b4; background-color: #033a16; }
[data-theme="dark"] .hljs-deletion { color: #ffdcd7; background-color: #67060c; }
```

---

### Subagent B — `aurora.css` + `sunset.css`

#### aurora.css 末尾追加

色彩：靛蓝/紫色系。亮色 bg `#ffffff`，text `#1e1b4b`；暗色 bg `#0f0f2e`，text `#e0e7ff`。

```css
/* ─── 代码块高亮（Aurora 亮色）─── */
.hljs {
  color: #1e1b4b;
  background: #ffffff;
}
.hljs-doctag, .hljs-keyword, .hljs-meta .hljs-keyword,
.hljs-template-tag, .hljs-template-variable,
.hljs-type, .hljs-variable.language_ { color: #7c3aed; }
.hljs-title, .hljs-title.class_,
.hljs-title.class_.inherited__, .hljs-title.function_ { color: #4f46e5; }
.hljs-attr, .hljs-attribute, .hljs-literal, .hljs-meta,
.hljs-number, .hljs-operator, .hljs-variable,
.hljs-selector-attr, .hljs-selector-class, .hljs-selector-id { color: #2563eb; }
.hljs-regexp, .hljs-string, .hljs-meta .hljs-string { color: #0369a1; }
.hljs-built_in, .hljs-symbol { color: #9333ea; }
.hljs-comment, .hljs-code, .hljs-formula { color: #6366a0; }
.hljs-name, .hljs-quote, .hljs-selector-tag, .hljs-selector-pseudo { color: #047857; }
.hljs-section { color: #4f46e5; font-weight: bold; }
.hljs-bullet { color: #b45309; }
.hljs-addition { color: #14532d; background-color: #f0fdf4; }
.hljs-deletion { color: #991b1b; background-color: #fef2f2; }

/* ─── 代码块高亮（Aurora 暗色）─── */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .hljs { color: #e0e7ff; background: #0f0f2e; }
  :root:not([data-theme="light"]) .hljs-doctag, :root:not([data-theme="light"]) .hljs-keyword,
  :root:not([data-theme="light"]) .hljs-meta .hljs-keyword,
  :root:not([data-theme="light"]) .hljs-template-tag, :root:not([data-theme="light"]) .hljs-template-variable,
  :root:not([data-theme="light"]) .hljs-type, :root:not([data-theme="light"]) .hljs-variable.language_ { color: #a78bfa; }
  :root:not([data-theme="light"]) .hljs-title, :root:not([data-theme="light"]) .hljs-title.class_,
  :root:not([data-theme="light"]) .hljs-title.class_.inherited__, :root:not([data-theme="light"]) .hljs-title.function_ { color: #818cf8; }
  :root:not([data-theme="light"]) .hljs-attr, :root:not([data-theme="light"]) .hljs-attribute,
  :root:not([data-theme="light"]) .hljs-literal, :root:not([data-theme="light"]) .hljs-meta,
  :root:not([data-theme="light"]) .hljs-number, :root:not([data-theme="light"]) .hljs-operator,
  :root:not([data-theme="light"]) .hljs-variable, :root:not([data-theme="light"]) .hljs-selector-attr,
  :root:not([data-theme="light"]) .hljs-selector-class, :root:not([data-theme="light"]) .hljs-selector-id { color: #60a5fa; }
  :root:not([data-theme="light"]) .hljs-regexp, :root:not([data-theme="light"]) .hljs-string,
  :root:not([data-theme="light"]) .hljs-meta .hljs-string { color: #67e8f9; }
  :root:not([data-theme="light"]) .hljs-built_in, :root:not([data-theme="light"]) .hljs-symbol { color: #c084fc; }
  :root:not([data-theme="light"]) .hljs-comment, :root:not([data-theme="light"]) .hljs-code,
  :root:not([data-theme="light"]) .hljs-formula { color: #8b8fc4; }
  :root:not([data-theme="light"]) .hljs-name, :root:not([data-theme="light"]) .hljs-quote,
  :root:not([data-theme="light"]) .hljs-selector-tag, :root:not([data-theme="light"]) .hljs-selector-pseudo { color: #4ade80; }
  :root:not([data-theme="light"]) .hljs-section { color: #818cf8; font-weight: bold; }
  :root:not([data-theme="light"]) .hljs-bullet { color: #fcd34d; }
  :root:not([data-theme="light"]) .hljs-addition { color: #86efac; background-color: #052e16; }
  :root:not([data-theme="light"]) .hljs-deletion { color: #fca5a5; background-color: #450a0a; }
}
[data-theme="dark"] .hljs { color: #e0e7ff; background: #0f0f2e; }
[data-theme="dark"] .hljs-doctag, [data-theme="dark"] .hljs-keyword,
[data-theme="dark"] .hljs-meta .hljs-keyword, [data-theme="dark"] .hljs-template-tag,
[data-theme="dark"] .hljs-template-variable, [data-theme="dark"] .hljs-type,
[data-theme="dark"] .hljs-variable.language_ { color: #a78bfa; }
[data-theme="dark"] .hljs-title, [data-theme="dark"] .hljs-title.class_,
[data-theme="dark"] .hljs-title.class_.inherited__, [data-theme="dark"] .hljs-title.function_ { color: #818cf8; }
[data-theme="dark"] .hljs-attr, [data-theme="dark"] .hljs-attribute,
[data-theme="dark"] .hljs-literal, [data-theme="dark"] .hljs-meta,
[data-theme="dark"] .hljs-number, [data-theme="dark"] .hljs-operator,
[data-theme="dark"] .hljs-variable, [data-theme="dark"] .hljs-selector-attr,
[data-theme="dark"] .hljs-selector-class, [data-theme="dark"] .hljs-selector-id { color: #60a5fa; }
[data-theme="dark"] .hljs-regexp, [data-theme="dark"] .hljs-string,
[data-theme="dark"] .hljs-meta .hljs-string { color: #67e8f9; }
[data-theme="dark"] .hljs-built_in, [data-theme="dark"] .hljs-symbol { color: #c084fc; }
[data-theme="dark"] .hljs-comment, [data-theme="dark"] .hljs-code,
[data-theme="dark"] .hljs-formula { color: #8b8fc4; }
[data-theme="dark"] .hljs-name, [data-theme="dark"] .hljs-quote,
[data-theme="dark"] .hljs-selector-tag, [data-theme="dark"] .hljs-selector-pseudo { color: #4ade80; }
[data-theme="dark"] .hljs-section { color: #818cf8; font-weight: bold; }
[data-theme="dark"] .hljs-bullet { color: #fcd34d; }
[data-theme="dark"] .hljs-addition { color: #86efac; background-color: #052e16; }
[data-theme="dark"] .hljs-deletion { color: #fca5a5; background-color: #450a0a; }
```

#### sunset.css 末尾追加

色彩：橙/珊瑚色系。亮色 bg `#ffffff`，text `#3b0f00`；暗色 bg `#2d1000`，text `#fff0e8`。

```css
/* ─── 代码块高亮（Sunset 亮色）─── */
.hljs {
  color: #3b0f00;
  background: #ffffff;
}
.hljs-doctag, .hljs-keyword, .hljs-meta .hljs-keyword,
.hljs-template-tag, .hljs-template-variable,
.hljs-type, .hljs-variable.language_ { color: #db2777; }
.hljs-title, .hljs-title.class_,
.hljs-title.class_.inherited__, .hljs-title.function_ { color: #ea580c; }
.hljs-attr, .hljs-attribute, .hljs-literal, .hljs-meta,
.hljs-number, .hljs-operator, .hljs-variable,
.hljs-selector-attr, .hljs-selector-class, .hljs-selector-id { color: #b45309; }
.hljs-regexp, .hljs-string, .hljs-meta .hljs-string { color: #15803d; }
.hljs-built_in, .hljs-symbol { color: #9a3412; }
.hljs-comment, .hljs-code, .hljs-formula { color: #9a4a2a; }
.hljs-name, .hljs-quote, .hljs-selector-tag, .hljs-selector-pseudo { color: #0369a1; }
.hljs-section { color: #ea580c; font-weight: bold; }
.hljs-bullet { color: #92400e; }
.hljs-addition { color: #14532d; background-color: #f0fdf4; }
.hljs-deletion { color: #991b1b; background-color: #fef2f2; }

/* ─── 代码块高亮（Sunset 暗色）─── */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .hljs { color: #fff0e8; background: #2d1000; }
  :root:not([data-theme="light"]) .hljs-doctag, :root:not([data-theme="light"]) .hljs-keyword,
  :root:not([data-theme="light"]) .hljs-meta .hljs-keyword,
  :root:not([data-theme="light"]) .hljs-template-tag, :root:not([data-theme="light"]) .hljs-template-variable,
  :root:not([data-theme="light"]) .hljs-type, :root:not([data-theme="light"]) .hljs-variable.language_ { color: #f472b6; }
  :root:not([data-theme="light"]) .hljs-title, :root:not([data-theme="light"]) .hljs-title.class_,
  :root:not([data-theme="light"]) .hljs-title.class_.inherited__, :root:not([data-theme="light"]) .hljs-title.function_ { color: #fb923c; }
  :root:not([data-theme="light"]) .hljs-attr, :root:not([data-theme="light"]) .hljs-attribute,
  :root:not([data-theme="light"]) .hljs-literal, :root:not([data-theme="light"]) .hljs-meta,
  :root:not([data-theme="light"]) .hljs-number, :root:not([data-theme="light"]) .hljs-operator,
  :root:not([data-theme="light"]) .hljs-variable, :root:not([data-theme="light"]) .hljs-selector-attr,
  :root:not([data-theme="light"]) .hljs-selector-class, :root:not([data-theme="light"]) .hljs-selector-id { color: #fbbf24; }
  :root:not([data-theme="light"]) .hljs-regexp, :root:not([data-theme="light"]) .hljs-string,
  :root:not([data-theme="light"]) .hljs-meta .hljs-string { color: #6ee7b7; }
  :root:not([data-theme="light"]) .hljs-built_in, :root:not([data-theme="light"]) .hljs-symbol { color: #fdba74; }
  :root:not([data-theme="light"]) .hljs-comment, :root:not([data-theme="light"]) .hljs-code,
  :root:not([data-theme="light"]) .hljs-formula { color: #c08060; }
  :root:not([data-theme="light"]) .hljs-name, :root:not([data-theme="light"]) .hljs-quote,
  :root:not([data-theme="light"]) .hljs-selector-tag, :root:not([data-theme="light"]) .hljs-selector-pseudo { color: #67e8f9; }
  :root:not([data-theme="light"]) .hljs-section { color: #fb923c; font-weight: bold; }
  :root:not([data-theme="light"]) .hljs-bullet { color: #fcd34d; }
  :root:not([data-theme="light"]) .hljs-addition { color: #86efac; background-color: #052e16; }
  :root:not([data-theme="light"]) .hljs-deletion { color: #fca5a5; background-color: #450a0a; }
}
[data-theme="dark"] .hljs { color: #fff0e8; background: #2d1000; }
[data-theme="dark"] .hljs-doctag, [data-theme="dark"] .hljs-keyword,
[data-theme="dark"] .hljs-meta .hljs-keyword, [data-theme="dark"] .hljs-template-tag,
[data-theme="dark"] .hljs-template-variable, [data-theme="dark"] .hljs-type,
[data-theme="dark"] .hljs-variable.language_ { color: #f472b6; }
[data-theme="dark"] .hljs-title, [data-theme="dark"] .hljs-title.class_,
[data-theme="dark"] .hljs-title.class_.inherited__, [data-theme="dark"] .hljs-title.function_ { color: #fb923c; }
[data-theme="dark"] .hljs-attr, [data-theme="dark"] .hljs-attribute,
[data-theme="dark"] .hljs-literal, [data-theme="dark"] .hljs-meta,
[data-theme="dark"] .hljs-number, [data-theme="dark"] .hljs-operator,
[data-theme="dark"] .hljs-variable, [data-theme="dark"] .hljs-selector-attr,
[data-theme="dark"] .hljs-selector-class, [data-theme="dark"] .hljs-selector-id { color: #fbbf24; }
[data-theme="dark"] .hljs-regexp, [data-theme="dark"] .hljs-string,
[data-theme="dark"] .hljs-meta .hljs-string { color: #6ee7b7; }
[data-theme="dark"] .hljs-built_in, [data-theme="dark"] .hljs-symbol { color: #fdba74; }
[data-theme="dark"] .hljs-comment, [data-theme="dark"] .hljs-code,
[data-theme="dark"] .hljs-formula { color: #c08060; }
[data-theme="dark"] .hljs-name, [data-theme="dark"] .hljs-quote,
[data-theme="dark"] .hljs-selector-tag, [data-theme="dark"] .hljs-selector-pseudo { color: #67e8f9; }
[data-theme="dark"] .hljs-section { color: #fb923c; font-weight: bold; }
[data-theme="dark"] .hljs-bullet { color: #fcd34d; }
[data-theme="dark"] .hljs-addition { color: #86efac; background-color: #052e16; }
[data-theme="dark"] .hljs-deletion { color: #fca5a5; background-color: #450a0a; }
```

---

### Subagent C — `ocean.css` + `rose.css`

#### ocean.css 末尾追加

色彩：青蓝/蓝绿色系。亮色 bg `#ffffff`，text `#052e38`；暗色 bg `#001e2a`，text `#e0f8ff`。

```css
/* ─── 代码块高亮（Ocean 亮色）─── */
.hljs {
  color: #052e38;
  background: #ffffff;
}
.hljs-doctag, .hljs-keyword, .hljs-meta .hljs-keyword,
.hljs-template-tag, .hljs-template-variable,
.hljs-type, .hljs-variable.language_ { color: #0d9488; }
.hljs-title, .hljs-title.class_,
.hljs-title.class_.inherited__, .hljs-title.function_ { color: #0891b2; }
.hljs-attr, .hljs-attribute, .hljs-literal, .hljs-meta,
.hljs-number, .hljs-operator, .hljs-variable,
.hljs-selector-attr, .hljs-selector-class, .hljs-selector-id { color: #0369a1; }
.hljs-regexp, .hljs-string, .hljs-meta .hljs-string { color: #1d4ed8; }
.hljs-built_in, .hljs-symbol { color: #0284c7; }
.hljs-comment, .hljs-code, .hljs-formula { color: #3a7a8a; }
.hljs-name, .hljs-quote, .hljs-selector-tag, .hljs-selector-pseudo { color: #059669; }
.hljs-section { color: #0891b2; font-weight: bold; }
.hljs-bullet { color: #0369a1; }
.hljs-addition { color: #14532d; background-color: #f0fdf4; }
.hljs-deletion { color: #991b1b; background-color: #fef2f2; }

/* ─── 代码块高亮（Ocean 暗色）─── */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .hljs { color: #e0f8ff; background: #001e2a; }
  :root:not([data-theme="light"]) .hljs-doctag, :root:not([data-theme="light"]) .hljs-keyword,
  :root:not([data-theme="light"]) .hljs-meta .hljs-keyword,
  :root:not([data-theme="light"]) .hljs-template-tag, :root:not([data-theme="light"]) .hljs-template-variable,
  :root:not([data-theme="light"]) .hljs-type, :root:not([data-theme="light"]) .hljs-variable.language_ { color: #2dd4bf; }
  :root:not([data-theme="light"]) .hljs-title, :root:not([data-theme="light"]) .hljs-title.class_,
  :root:not([data-theme="light"]) .hljs-title.class_.inherited__, :root:not([data-theme="light"]) .hljs-title.function_ { color: #22d3ee; }
  :root:not([data-theme="light"]) .hljs-attr, :root:not([data-theme="light"]) .hljs-attribute,
  :root:not([data-theme="light"]) .hljs-literal, :root:not([data-theme="light"]) .hljs-meta,
  :root:not([data-theme="light"]) .hljs-number, :root:not([data-theme="light"]) .hljs-operator,
  :root:not([data-theme="light"]) .hljs-variable, :root:not([data-theme="light"]) .hljs-selector-attr,
  :root:not([data-theme="light"]) .hljs-selector-class, :root:not([data-theme="light"]) .hljs-selector-id { color: #38bdf8; }
  :root:not([data-theme="light"]) .hljs-regexp, :root:not([data-theme="light"]) .hljs-string,
  :root:not([data-theme="light"]) .hljs-meta .hljs-string { color: #93c5fd; }
  :root:not([data-theme="light"]) .hljs-built_in, :root:not([data-theme="light"]) .hljs-symbol { color: #7dd3fc; }
  :root:not([data-theme="light"]) .hljs-comment, :root:not([data-theme="light"]) .hljs-code,
  :root:not([data-theme="light"]) .hljs-formula { color: #5aabb8; }
  :root:not([data-theme="light"]) .hljs-name, :root:not([data-theme="light"]) .hljs-quote,
  :root:not([data-theme="light"]) .hljs-selector-tag, :root:not([data-theme="light"]) .hljs-selector-pseudo { color: #4ade80; }
  :root:not([data-theme="light"]) .hljs-section { color: #22d3ee; font-weight: bold; }
  :root:not([data-theme="light"]) .hljs-bullet { color: #38bdf8; }
  :root:not([data-theme="light"]) .hljs-addition { color: #86efac; background-color: #052e16; }
  :root:not([data-theme="light"]) .hljs-deletion { color: #fca5a5; background-color: #450a0a; }
}
[data-theme="dark"] .hljs { color: #e0f8ff; background: #001e2a; }
[data-theme="dark"] .hljs-doctag, [data-theme="dark"] .hljs-keyword,
[data-theme="dark"] .hljs-meta .hljs-keyword, [data-theme="dark"] .hljs-template-tag,
[data-theme="dark"] .hljs-template-variable, [data-theme="dark"] .hljs-type,
[data-theme="dark"] .hljs-variable.language_ { color: #2dd4bf; }
[data-theme="dark"] .hljs-title, [data-theme="dark"] .hljs-title.class_,
[data-theme="dark"] .hljs-title.class_.inherited__, [data-theme="dark"] .hljs-title.function_ { color: #22d3ee; }
[data-theme="dark"] .hljs-attr, [data-theme="dark"] .hljs-attribute,
[data-theme="dark"] .hljs-literal, [data-theme="dark"] .hljs-meta,
[data-theme="dark"] .hljs-number, [data-theme="dark"] .hljs-operator,
[data-theme="dark"] .hljs-variable, [data-theme="dark"] .hljs-selector-attr,
[data-theme="dark"] .hljs-selector-class, [data-theme="dark"] .hljs-selector-id { color: #38bdf8; }
[data-theme="dark"] .hljs-regexp, [data-theme="dark"] .hljs-string,
[data-theme="dark"] .hljs-meta .hljs-string { color: #93c5fd; }
[data-theme="dark"] .hljs-built_in, [data-theme="dark"] .hljs-symbol { color: #7dd3fc; }
[data-theme="dark"] .hljs-comment, [data-theme="dark"] .hljs-code,
[data-theme="dark"] .hljs-formula { color: #5aabb8; }
[data-theme="dark"] .hljs-name, [data-theme="dark"] .hljs-quote,
[data-theme="dark"] .hljs-selector-tag, [data-theme="dark"] .hljs-selector-pseudo { color: #4ade80; }
[data-theme="dark"] .hljs-section { color: #22d3ee; font-weight: bold; }
[data-theme="dark"] .hljs-bullet { color: #38bdf8; }
[data-theme="dark"] .hljs-addition { color: #86efac; background-color: #052e16; }
[data-theme="dark"] .hljs-deletion { color: #fca5a5; background-color: #450a0a; }
```

#### rose.css 末尾追加

色彩：玫瑰/粉红色系。亮色 bg `#ffffff`，text `#3b0010`；暗色 bg `#2d0015`，text `#ffe0e8`。

```css
/* ─── 代码块高亮（Rose 亮色）─── */
.hljs {
  color: #3b0010;
  background: #ffffff;
}
.hljs-doctag, .hljs-keyword, .hljs-meta .hljs-keyword,
.hljs-template-tag, .hljs-template-variable,
.hljs-type, .hljs-variable.language_ { color: #e11d48; }
.hljs-title, .hljs-title.class_,
.hljs-title.class_.inherited__, .hljs-title.function_ { color: #9f1239; }
.hljs-attr, .hljs-attribute, .hljs-literal, .hljs-meta,
.hljs-number, .hljs-operator, .hljs-variable,
.hljs-selector-attr, .hljs-selector-class, .hljs-selector-id { color: #b45309; }
.hljs-regexp, .hljs-string, .hljs-meta .hljs-string { color: #0369a1; }
.hljs-built_in, .hljs-symbol { color: #c026d3; }
.hljs-comment, .hljs-code, .hljs-formula { color: #9a3050; }
.hljs-name, .hljs-quote, .hljs-selector-tag, .hljs-selector-pseudo { color: #059669; }
.hljs-section { color: #e11d48; font-weight: bold; }
.hljs-bullet { color: #92400e; }
.hljs-addition { color: #14532d; background-color: #f0fdf4; }
.hljs-deletion { color: #991b1b; background-color: #fef2f2; }

/* ─── 代码块高亮（Rose 暗色）─── */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .hljs { color: #ffe0e8; background: #2d0015; }
  :root:not([data-theme="light"]) .hljs-doctag, :root:not([data-theme="light"]) .hljs-keyword,
  :root:not([data-theme="light"]) .hljs-meta .hljs-keyword,
  :root:not([data-theme="light"]) .hljs-template-tag, :root:not([data-theme="light"]) .hljs-template-variable,
  :root:not([data-theme="light"]) .hljs-type, :root:not([data-theme="light"]) .hljs-variable.language_ { color: #fb7185; }
  :root:not([data-theme="light"]) .hljs-title, :root:not([data-theme="light"]) .hljs-title.class_,
  :root:not([data-theme="light"]) .hljs-title.class_.inherited__, :root:not([data-theme="light"]) .hljs-title.function_ { color: #f9a8d4; }
  :root:not([data-theme="light"]) .hljs-attr, :root:not([data-theme="light"]) .hljs-attribute,
  :root:not([data-theme="light"]) .hljs-literal, :root:not([data-theme="light"]) .hljs-meta,
  :root:not([data-theme="light"]) .hljs-number, :root:not([data-theme="light"]) .hljs-operator,
  :root:not([data-theme="light"]) .hljs-variable, :root:not([data-theme="light"]) .hljs-selector-attr,
  :root:not([data-theme="light"]) .hljs-selector-class, :root:not([data-theme="light"]) .hljs-selector-id { color: #fbbf24; }
  :root:not([data-theme="light"]) .hljs-regexp, :root:not([data-theme="light"]) .hljs-string,
  :root:not([data-theme="light"]) .hljs-meta .hljs-string { color: #93c5fd; }
  :root:not([data-theme="light"]) .hljs-built_in, :root:not([data-theme="light"]) .hljs-symbol { color: #e879f9; }
  :root:not([data-theme="light"]) .hljs-comment, :root:not([data-theme="light"]) .hljs-code,
  :root:not([data-theme="light"]) .hljs-formula { color: #c06080; }
  :root:not([data-theme="light"]) .hljs-name, :root:not([data-theme="light"]) .hljs-quote,
  :root:not([data-theme="light"]) .hljs-selector-tag, :root:not([data-theme="light"]) .hljs-selector-pseudo { color: #4ade80; }
  :root:not([data-theme="light"]) .hljs-section { color: #fb7185; font-weight: bold; }
  :root:not([data-theme="light"]) .hljs-bullet { color: #fcd34d; }
  :root:not([data-theme="light"]) .hljs-addition { color: #86efac; background-color: #052e16; }
  :root:not([data-theme="light"]) .hljs-deletion { color: #fca5a5; background-color: #450a0a; }
}
[data-theme="dark"] .hljs { color: #ffe0e8; background: #2d0015; }
[data-theme="dark"] .hljs-doctag, [data-theme="dark"] .hljs-keyword,
[data-theme="dark"] .hljs-meta .hljs-keyword, [data-theme="dark"] .hljs-template-tag,
[data-theme="dark"] .hljs-template-variable, [data-theme="dark"] .hljs-type,
[data-theme="dark"] .hljs-variable.language_ { color: #fb7185; }
[data-theme="dark"] .hljs-title, [data-theme="dark"] .hljs-title.class_,
[data-theme="dark"] .hljs-title.class_.inherited__, [data-theme="dark"] .hljs-title.function_ { color: #f9a8d4; }
[data-theme="dark"] .hljs-attr, [data-theme="dark"] .hljs-attribute,
[data-theme="dark"] .hljs-literal, [data-theme="dark"] .hljs-meta,
[data-theme="dark"] .hljs-number, [data-theme="dark"] .hljs-operator,
[data-theme="dark"] .hljs-variable, [data-theme="dark"] .hljs-selector-attr,
[data-theme="dark"] .hljs-selector-class, [data-theme="dark"] .hljs-selector-id { color: #fbbf24; }
[data-theme="dark"] .hljs-regexp, [data-theme="dark"] .hljs-string,
[data-theme="dark"] .hljs-meta .hljs-string { color: #93c5fd; }
[data-theme="dark"] .hljs-built_in, [data-theme="dark"] .hljs-symbol { color: #e879f9; }
[data-theme="dark"] .hljs-comment, [data-theme="dark"] .hljs-code,
[data-theme="dark"] .hljs-formula { color: #c06080; }
[data-theme="dark"] .hljs-name, [data-theme="dark"] .hljs-quote,
[data-theme="dark"] .hljs-selector-tag, [data-theme="dark"] .hljs-selector-pseudo { color: #4ade80; }
[data-theme="dark"] .hljs-section { color: #fb7185; font-weight: bold; }
[data-theme="dark"] .hljs-bullet { color: #fcd34d; }
[data-theme="dark"] .hljs-addition { color: #86efac; background-color: #052e16; }
[data-theme="dark"] .hljs-deletion { color: #fca5a5; background-color: #450a0a; }
```

---

## 验证

1. `npm run dev`，访问 `/posts/hello-walle` 文章页（含多语言代码块）
2. 亮色模式：代码块背景 `#ffffff`，token 颜色符合当前 scheme 色系
3. 切换暗色模式：代码块背景变为 scheme surface 色（aurora `#0f0f2e`，sunset `#2d1000`，ocean `#001e2a`，rose `#2d0015`）
4. 修改 `config.ts` 的 `colorScheme` 切换方案，代码块配色随之变化
5. 将 `config.ts` 的 `theme` 改为 `base`，亮色使用 github.css，暗色使用 globals.css 兜底规则（bg `#161b22`）
