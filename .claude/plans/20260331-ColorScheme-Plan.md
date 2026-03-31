# Plan: colorScheme 页面切换功能

## 目标

`themeOptions.colorScheme` 支持用户在页面上实时切换配色方案（aurora/sunset/ocean/rose），类似亮/暗模式切换，无需刷新页面。

---

## 技术方案

**关键约束**：`ThemeGlobalStyles` 是 Server Component，只能静态注入 CSS，无法运行时替换 `<style>` 内容。

**解法**：将所有 scheme 的 CSS 变量重构为 `html[data-color-scheme="xxx"]` 选择器，构建时一次性全部注入 `<head>`，客户端切换时只改 `data-color-scheme` 属性，浏览器自动响应。

---

## 文件变更清单

| 文件 | 变更 |
|:---|:---|
| `src/themes/liquid-glass/schemes/aurora.css` | 所有选择器加 `html[data-color-scheme="aurora"]` 前缀 |
| `src/themes/liquid-glass/schemes/sunset.css` | 同上，`sunset` 前缀 |
| `src/themes/liquid-glass/schemes/ocean.css` | 同上，`ocean` 前缀 |
| `src/themes/liquid-glass/schemes/rose.css` | 同上，`rose` 前缀 |
| `src/core/ThemeGlobalStyles.tsx` | 改为遍历 `schemes/` 目录注入所有 CSS |
| `src/core/lib/useColorScheme.ts` | 新建 Hook，管理 `data-color-scheme` 属性与 localStorage |
| `src/themes/liquid-glass/NavbarClient.tsx` | 新建，包含调色盘图标 + 下拉切换 UI |
| `src/themes/liquid-glass/Navbar.tsx` | 改从 `./NavbarClient` 导入（原为 base） |
| `app/layout.tsx` | 阻塞脚本追加 `data-color-scheme` 设置，防 FOUC |
| `src/core/config.ts` | `themeOptions` 中新增 `colorSchemes` 数组 |
| `app/globals.css` | 追加暗色模式代码块高亮兜底规则（github-dark 风格） |

---

## scheme.css 选择器结构

```css
/* 亮色 */
html[data-color-scheme="aurora"] { --color-background: #f0f4ff; ... }

/* 暗色（系统偏好） */
@media (prefers-color-scheme: dark) {
  html[data-color-scheme="aurora"]:not([data-theme="light"]) { ... }
}
/* 暗色（手动切换） */
html[data-color-scheme="aurora"][data-theme="dark"] { ... }

/* 代码块高亮（亮色） */
html[data-color-scheme="aurora"] .hljs { ... }

/* 代码块高亮（暗色） */
html[data-color-scheme="aurora"][data-theme="dark"] .hljs { ... }
```

---

## useColorScheme Hook

```ts
"use client";
import { useState, useEffect } from "react";
import { siteConfig } from "@/src/core/config";

type ColorScheme = 'aurora' | 'sunset' | 'ocean' | 'rose';
const DEFAULT = siteConfig.themeOptions?.colorScheme ?? 'aurora';

export function useColorScheme() {
  const [scheme, setSchemeState] = useState<ColorScheme>(DEFAULT);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('color-scheme') as ColorScheme | null;
    const valid: ColorScheme[] = ['aurora', 'sunset', 'ocean', 'rose'];
    const resolved = stored && valid.includes(stored) ? stored : DEFAULT;
    setSchemeState(resolved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-color-scheme', scheme);
    localStorage.setItem('color-scheme', scheme);
  }, [scheme, mounted]);

  return { scheme, setScheme: setSchemeState, mounted };
}
```

---

## 架构约定

- 配色方案切换 UI 属于 liquid-glass 主题的特性，**必须放在** `src/themes/liquid-glass/NavbarClient.tsx`
- `base/NavbarClient.tsx` 保持纯净（只有主题切换 + 搜索），不感知配色方案
- 其他主题若需要配色切换，各自实现自己的 `NavbarClient.tsx`

---

## 验证

1. `npm run dev`，`<html>` 元素有 `data-color-scheme="sunset"`（或 config 默认值）
2. 点击 Navbar 调色盘图标，下拉面板显示 4 个配色选项
3. 点击切换，页面背景色实时变化，无刷新
4. 刷新后配色方案保持（localStorage 持久化），无 FOUC
5. 切换亮/暗模式，各 scheme 的暗色变量正确响应
6. 代码块高亮颜色随 scheme 变化
