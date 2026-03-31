# Theme Toggle 实现计划

**日期：** 2026-03-31
**状态：** ✅ 已完成

## 需求

在导航栏增加日/夜切换按钮，支持手动覆盖系统主题偏好，并通过 `localStorage` 持久化选择。

## 架构决策

**保持 CSS 变量方案，不迁移到 Tailwind `dark:` class 策略。**

通过在 `<html>` 上设置 `data-theme="dark"` / `data-theme="light"` 属性来控制主题，CSS 变量块同时响应 `@media` 和 `data-theme` 属性。

三种状态逻辑：
- 无 `data-theme` + 系统暗色 → 暗色（媒体查询生效，`:not([data-theme="light"])` 通过）
- `data-theme="dark"` → 暗色（属性块生效）
- `data-theme="light"` + 系统暗色 → 亮色（`:not([data-theme="light"])` 阻断媒体查询）

## 修改文件

| 文件 | 变更内容 |
|:---|:---|
| `src/core/config.ts` | 新增 `features.themeToggle: true` 功能开关 |
| `src/core/lib/useTheme.ts` | 新建：主题状态 Hook（localStorage + mounted 防闪烁） |
| `app/layout.tsx` | 新增阻塞式内联脚本防 FOUC，在 React 水合前设置 `data-theme` |
| `app/globals.css` | 两处暗色块扩展为 `@media + :not` 与 `[data-theme="dark"]` 双重响应 |
| `tailwind.config.ts` | 新增 `darkMode: ['selector', '[data-theme="dark"]']`，使 `dark:prose-invert` 响应手动切换 |
| `src/themes/base/NavbarClient.tsx` | 引入 `useTheme`，搜索按钮左侧加日/夜切换按钮（月亮/太阳 SVG） |

## FOUC 防止机制

在 `app/layout.tsx` 的 `<head>` 中注入阻塞式内联脚本：

```js
(function(){
  var s = localStorage.getItem('theme');
  var t = s === 'light' || s === 'dark'
    ? s
    : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', t);
})();
```

该脚本在 CSS 应用前同步执行，确保首次渲染即为正确主题。

## useTheme Hook 设计

- `mounted` 状态防止 SSR 水合不匹配，按钮在 `mounted=true` 后才渲染
- 第一个 `useEffect`：读取 localStorage / 系统偏好，设置初始状态
- 第二个 `useEffect`：状态变化时同步到 `document.documentElement` 和 localStorage
