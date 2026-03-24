# 样式规范

## 色彩系统

使用 CSS 变量驱动的语义色彩，定义在 `app/globals.css`：

| Tailwind 类 | CSS 变量 | 用途 |
|:---|:---|:---|
| `bg-background` | `--color-background` | 页面背景 |
| `bg-surface` | `--color-surface` | 卡片、模态框背景 |
| `border-border` | `--color-border` | 边框、分割线 |
| `text-primary` | `--color-primary` | 主色（链接、强调） |
| `text-secondary` | `--color-secondary` | 次要交互元素 |
| `text-foreground` | `--color-text` | 正文文字 |
| `text-muted` | `--color-text-muted` | 辅助信息、占位符 |

### 禁止事项

```tsx
// ❌ 禁止使用 Tailwind 原始色值
<div className="bg-gray-100 text-blue-500 border-gray-200">

// ✅ 使用语义色彩类
<div className="bg-surface text-primary border-border">
```

## 布局约束

- 内容区最大宽度：`max-w-3xl`
- 水平内边距：`px-4`
- 典型容器：`mx-auto flex max-w-3xl px-4`

## 深色模式

`globals.css` 通过 `@media (prefers-color-scheme: dark)` 自动切换色彩变量，组件无需手动处理深色模式，直接使用语义色彩类即可。

## 响应式设计

- 以移动端为基准（mobile-first）
- 使用 Tailwind 断点前缀（`sm:`、`md:`、`lg:`）做响应式调整
- 导航栏为 `sticky top-0 z-50`，确保始终可见

## 交互状态

- 链接悬停：`hover:text-primary transition-colors`
- 按钮悬停：`hover:opacity-80` 或 `hover:text-primary transition-colors`
- 过渡动画统一使用 `transition-colors`（颜色过渡），避免使用过重的动画
