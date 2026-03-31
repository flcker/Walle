# 主题系统规则

## 主题目录结构

```
src/themes/
├── base/                 # 默认主题（必须包含所有组件的完整实现）
│   ├── Navbar.tsx
│   ├── NavbarClient.tsx
│   ├── PostCard.tsx
│   ├── ArchiveList.tsx
│   ├── Calendar.tsx
│   ├── Pagination.tsx
│   ├── SearchModal.tsx
│   ├── TagList.tsx
│   └── CategoryList.tsx
├── liquid-glass/         # Liquid Glass 主题示例（当前激活）
│   ├── theme.css         # 结构 CSS（blob 动画 + 卡片结构，不含颜色）
│   ├── schemes/          # 多配色方案
│   │   ├── aurora.css    #   靛蓝极光（默认）
│   │   ├── sunset.css    #   日落珊瑚
│   │   ├── ocean.css     #   深海蓝绿
│   │   └── rose.css      #   玫瑰粉
│   ├── Navbar.tsx
│   ├── PostCard.tsx
│   ├── Footer.tsx
│   └── Profile.tsx
└── <your-theme>/         # 自定义主题（只放需要覆盖的部分）
    ├── theme.css         # 可选：颜色变量 + 主题特效
    ├── schemes/          # 可选：多配色方案目录
    └── PostCard.tsx      # 可选：覆盖组件
```

## 主题 CSS 机制（theme.css + schemes/）

每个主题可以提供 `theme.css`，用于定义颜色变量、动画、主题特效类。该文件由 `src/core/ThemeGlobalStyles.tsx`（Server Component）在构建时读取并注入到 `<head>` 中，**无需修改 `app/globals.css` 或任何 `app/` 目录文件**。

### 单配色主题（theme.css）

颜色变量与结构 CSS 写在同一个 `theme.css`：

```css
/* ─── 亮色调色板 ─────────────────────────────── */
:root {
  --color-background: ...;
  --color-surface:    ...;
  --color-border:     ...;
  --color-primary:    ...;
  --color-secondary:  ...;
  --color-text:       ...;
  --color-text-muted: ...;
}

/* ─── 暗色调色板 ─────────────────────────────── */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { ... }
}
[data-theme="dark"] { ... }

/* ─── 主题特效类（动画、卡片、导航栏等） ──────── */
@keyframes my-animation { ... }
.my-card { ... }
.my-navbar { ... }
```

### 多配色方案（schemes/ 子目录）

若主题支持多套配色（如 `liquid-glass`），将颜色相关 CSS 拆分到 `schemes/` 子目录，`theme.css` 只保留结构 CSS（动画关键帧、卡片形状等，不含颜色）：

```
src/themes/my-theme/
├── theme.css           ← 结构 CSS（动画、卡片形状，不含颜色变量）
└── schemes/
    ├── default.css     ← 颜色变量 + 特效颜色
    └── warm.css        ← 另一套颜色变量 + 特效颜色
```

`config.ts` 中通过 `themeOptions.colorScheme` 选择方案，`ThemeGlobalStyles` 自动合并：
`schemes/{colorScheme}.css`（先注入，提供颜色）+ `theme.css`（后注入，提供结构）。

`app/globals.css` 中的默认变量（base 颜色）作为兜底，theme.css / scheme.css 的 `:root` 声明会覆盖它们。

## 注册新主题组件

新增一个主题组件需要完成以下三步：

### 步骤 1：在 `types/index.ts` 定义 Props 类型

```ts
// src/core/types/index.ts
export interface MyComponentProps {
  // ...
}
```

### 步骤 2：在 `ThemeResolver.tsx` 注册动态组件

```ts
// src/core/ThemeResolver.tsx
import type { MyComponentProps } from "./types";

export const ThemedMyComponent = dynamic<MyComponentProps>(
  () =>
    import(`../themes/${theme}/MyComponent`).catch(() =>
      import("../themes/base/MyComponent")
    )
);
```

### 步骤 3：在 `base/` 创建默认实现

```tsx
// src/themes/base/MyComponent.tsx
import type { MyComponentProps } from "@/src/core/types";

export default function MyComponent({ ...props }: MyComponentProps) {
  // 完整实现
}
```

## 创建自定义主题

1. 在 `src/themes/` 下创建新目录，如 `src/themes/dark/`
2. 按需放置 `theme.css`（颜色/动画）和组件文件（覆盖组件）
3. 修改 `src/core/config.ts` 的 `theme` 字段为新主题名
4. 未覆盖的组件自动回退到 `base/` 主题
5. **无需修改 `app/` 目录任何文件**

## 禁止事项

- 禁止在自定义主题中重写与 base 完全相同的组件（无差异就不要覆盖）
- 禁止在页面组件中直接 import `src/themes/base/*`，必须通过 `ThemeResolver` 的 `Themed*` 组件
- 禁止在 `ThemeResolver.tsx` 中处理业务逻辑，仅做组件注册
- **禁止将主题颜色变量或动画写入 `app/globals.css`**，应放入主题自己的 `theme.css`
