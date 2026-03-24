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
└── <your-theme>/         # 自定义主题（只放需要覆盖的组件）
    └── PostCard.tsx      # 示例：只覆盖文章卡片
```

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
2. 只放需要覆盖的组件文件
3. 修改 `src/core/config.ts` 的 `theme` 字段为新主题名
4. 未覆盖的组件自动回退到 `base/` 主题

## 禁止事项

- 禁止在自定义主题中重写与 base 完全相同的组件（无差异就不要覆盖）
- 禁止在页面组件中直接 import `src/themes/base/*`，必须通过 `ThemeResolver` 的 `Themed*` 组件
- 禁止在 `ThemeResolver.tsx` 中处理业务逻辑，仅做组件注册
