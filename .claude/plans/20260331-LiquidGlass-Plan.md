# Liquid Glass 主题实现计划

## Context

新增 `liquid-glass` 主题，实现 iOS 26 风格的液态玻璃（Liquid Glass）效果：
- 高透明度磨砂玻璃卡片，带有折射光晕
- 多彩背景光源 blob（蓝/紫/青色调）
- 玻璃边框顶部高光（折射感核心）
- 深色/浅色双模式完整支持
- **多套配色方案，可在 config.ts 一行切换**

架构与 liquid-grass 完全一致：所有主题内容自包含在 `src/themes/liquid-glass/`，不修改 `app/` 任何文件。激活方式：`src/core/config.ts` 的 `theme` 字段改为 `'liquid-glass'`。

---

## 架构设计

### 配色与结构分离

```
src/themes/liquid-glass/
├── theme.css              # 结构性 CSS（blob 动画关键帧 + .lgl-glass-card + .lgl-navbar）
├── schemes/               # 各配色方案（颜色变量 + blob 颜色）
│   ├── aurora.css         # 靛蓝/紫/青（默认）
│   ├── sunset.css         # 珊瑚/橙/玫红
│   ├── ocean.css          # 青/蓝绿/深海
│   └── rose.css           # 玫瑰/粉/红
├── Navbar.tsx
├── PostCard.tsx
├── Footer.tsx
└── Profile.tsx
```

### 配置方式（config.ts）

```ts
themeOptions: {
  colorScheme: 'aurora',  // 'aurora' | 'sunset' | 'ocean' | 'rose'
},
```

### ThemeGlobalStyles 加载逻辑

```
schemes/{colorScheme}.css（颜色变量 + blob 颜色）
  +
theme.css（动画关键帧 + 结构类）
  ↓
<style>{ 合并后的 CSS }</style>
```

---

## 视觉设计

### 四套配色方案

| 方案 | 名称 | 亮色主色 | 亮色 Blob | 暗色主色 |
|---|---|---|---|---|
| `aurora` | 靛蓝极光 | `#4f46e5` | 靛蓝+紫+青 | `#818cf8` |
| `sunset` | 日落珊瑚 | `#ea580c` | 橙+玫红+金 | `#fb923c` |
| `ocean` | 深海蓝绿 | `#0891b2` | 青+蓝绿+天蓝 | `#22d3ee` |
| `rose` | 玫瑰粉 | `#e11d48` | 玫红+粉+紫 | `#fb7185` |

### 玻璃卡片（与配色无关，在 theme.css 中）
```css
background: rgba(255, 255, 255, 0.55);
backdrop-filter: blur(20px) saturate(180%);
border: 1px solid rgba(255, 255, 255, 0.70);
box-shadow: 0 8px 32px -4px rgba(…, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.80); /* 折射高光 */
```

---

## 完整变更清单

### 第一阶段：已完成（v1）
- `src/themes/liquid-glass/theme.css` — 调色板 + blob 动画 + 玻璃卡片（aurora 单配色）
- `src/themes/liquid-glass/Navbar.tsx` / `PostCard.tsx` / `Footer.tsx` / `Profile.tsx`
- `src/core/config.ts` — `theme: 'liquid-glass'`

### 第二阶段：多配色支持（v2）

**新建文件（4 个）**
- `src/themes/liquid-glass/schemes/aurora.css` — 从 theme.css 提取当前配色
- `src/themes/liquid-glass/schemes/sunset.css` — 日落珊瑚
- `src/themes/liquid-glass/schemes/ocean.css` — 深海蓝绿
- `src/themes/liquid-glass/schemes/rose.css` — 玫瑰粉

**修改文件（3 个）**
- `src/themes/liquid-glass/theme.css` — 移除颜色变量，仅保留结构 CSS
- `src/core/ThemeGlobalStyles.tsx` — 合并 scheme CSS + theme CSS 注入
- `src/core/config.ts` — 新增 `themeOptions.colorScheme: 'aurora'`

---

## 各 scheme CSS 结构

```css
/* ─── 亮色调色板 ────────────────── */
:root {
  --color-background: ...;
  --color-surface:    #ffffff;
  --color-border:     ...;
  --color-primary:    ...;
  --color-secondary:  ...;
  --color-text:       ...;
  --color-text-muted: ...;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { ... }
}
[data-theme="dark"] { ... }

/* ─── Blob 颜色 ─────────────────── */
@media (prefers-reduced-motion: no-preference) {
  body::before { background: ...; opacity: 0.20; }
  body::after  { background: ...; opacity: 0.16; }
}
.lgl-blob-3 { background: ...; }
@media (prefers-reduced-motion: no-preference) {
  .lgl-blob-3 { opacity: 0.12; }
}
[data-theme="dark"] body::before { background: ...; opacity: 0.28; }
[data-theme="dark"] body::after  { background: ...; opacity: 0.22; }
[data-theme="dark"] .lgl-blob-3  { background: ...; opacity: 0.18; }
```

---

## 验证方式

1. `npm run dev`，确认 `aurora` 配色正常
2. 改 `colorScheme: 'sunset'`，确认珊瑚橙色调
3. 改 `colorScheme: 'ocean'`，确认青蓝色调
4. 改 `colorScheme: 'rose'`，确认玫瑰粉色调
5. 每套配色验证暗色模式切换
6. `npm run lint`

---

## 关键文件路径

- `src/core/ThemeGlobalStyles.tsx` — scheme + theme 合并注入
- `src/core/config.ts` — `themeOptions.colorScheme`
- `src/themes/liquid-glass/theme.css` — 精简为结构 CSS
- `src/themes/liquid-glass/schemes/` — 各配色方案

---

## 实现结果（v2 完成）

### 已完成的文件变更

| 文件 | 操作 | 说明 |
|---|---|---|
| `src/themes/liquid-glass/schemes/aurora.css` | 新建 | 靛蓝极光配色 |
| `src/themes/liquid-glass/schemes/sunset.css` | 新建 | 日落珊瑚配色 |
| `src/themes/liquid-glass/schemes/ocean.css` | 新建 | 深海蓝绿配色 |
| `src/themes/liquid-glass/schemes/rose.css` | 新建 | 玫瑰粉配色 |
| `src/themes/liquid-glass/theme.css` | 修改 | 移除颜色变量，仅保留结构 CSS |
| `src/core/ThemeGlobalStyles.tsx` | 修改 | 支持合并 scheme CSS + theme CSS |
| `src/core/config.ts` | 修改 | 新增 `themeOptions: { colorScheme: 'aurora' }` |

### 各 scheme CSS 结构要点

每套 `schemes/*.css` 包含：
1. `:root` 亮色调色板（7 个 CSS 变量）
2. `@media (prefers-color-scheme: dark)` 暗色变量（系统深色模式）
3. `[data-theme="dark"]` 暗色变量（手动切换）
4. Blob 亮色颜色（`body::before` / `body::after` / `.lgl-blob-3`）
5. Blob 暗色颜色（`[data-theme="dark"]` 选择器）
6. `.lgl-glass-card` 亮色/暗色背景、边框、阴影
7. `.lgl-navbar` 亮色/暗色背景

### 注意事项

- `theme.css` 中的结构 CSS（blob 动画关键帧、卡片 `backdrop-filter`/`border-radius`/`padding`/`transition`）与配色无关，所有方案共用
- `ThemeGlobalStyles` 使用 `'themeOptions' in siteConfig` 类型守卫安全访问 `colorScheme`，兼容 `as const` 类型系统
- scheme CSS 先注入，`theme.css` 后注入，确保结构类的颜色属性（如卡片背景色）由 scheme 提供
