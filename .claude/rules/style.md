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

## 文章排版

文章正文使用 `@tailwindcss/typography` 插件提供排版样式：

- 文章页 `<article>` 固定使用 `prose prose-neutral max-w-none dark:prose-invert`
- prose 颜色变量已在 `tailwind.config.ts` 中全部映射到语义 CSS 变量，**禁止**单独覆盖 prose 颜色
- 暗色模式由 `dark:prose-invert` + `globals.css` 中的 `--tw-prose-invert-*` 变量处理，无需额外干预
- 内联代码（`code`）样式：背景 `var(--color-surface)`，去除默认的前后引号

## 深色模式

- `globals.css` 的暗色变量块同时响应两个条件：`@media (prefers-color-scheme: dark)` 和 `[data-theme="dark"]` 属性选择器
- `tailwind.config.ts` 使用 `darkMode: ['selector', '[data-theme="dark"]']`，`dark:` 前缀类（如 `dark:prose-invert`）随 `data-theme` 属性切换
- 切换逻辑封装在 `src/core/lib/useTheme.ts`，**禁止**在组件中直接操作 `document.documentElement` 或 `localStorage`
- 组件无需手动处理深色模式，直接使用语义色彩类（`bg-background`、`text-primary` 等）即可自动适配

### 主题切换流程

```
页面加载（HTML/CSS，无 JS）
  layout.tsx <head> 阻塞脚本 → 读 localStorage → 设置 data-theme
  CSS 变量块响应 data-theme → 首次渲染主题正确（无 FOUC）

React 水合后
  NavbarClient → useTheme() → 读 localStorage → 设置 mounted=true → 渲染切换按钮

用户点击切换
  toggle() → setTheme() → useEffect → setAttribute('data-theme', ...) + localStorage
  CSS 变量即时更新，无需重新渲染组件树
```

## 响应式设计

- 以移动端为基准（mobile-first）
- 使用 Tailwind 断点前缀（`sm:`、`md:`、`lg:`）做响应式调整
- 导航栏为 `sticky top-0 z-50`，确保始终可见

## 交互状态

- 链接悬停：`hover:text-primary transition-colors`
- 按钮悬停：`hover:opacity-80` 或 `hover:text-primary transition-colors`
- 过渡动画统一使用 `transition-colors`（颜色过渡），避免使用过重的动画
