# Footer + Profile 模块实现计划

## Context

用户希望：
1. **Footer**：在页面底部显示站点名称（Walle）和版权信息
2. **Profile 模块**：独立组件，显示个人头像、昵称、简介和社交链接（GitHub、微博、RSS），位置可通过配置控制

当前布局（`app/layout.tsx`）只有 `ThemedNavbar` 和 `<main>` 内容区，两者均缺失。

---

## Part 1：Footer

### 1.1 扩展 `src/core/config.ts`

在 `siteConfig` 中新增 `footer` 块：

```ts
footer: {
  copyright: 'Your Name',  // 版权归属名
},
```

### 1.2 在 `src/core/types/index.ts` 新增类型

```ts
export interface FooterProps {}
```

### 1.3 在 `src/core/ThemeResolver.tsx` 注册

```ts
export const ThemedFooter = dynamic<FooterProps>(
  () => import(`../themes/${theme}/Footer`).catch(() => import("../themes/base/Footer"))
);
```

### 1.4 创建 `src/themes/base/Footer.tsx`

- `<footer>` 带顶部边框：`border-t border-border bg-background`
- 内容区与 Navbar 对齐：`mx-auto max-w-3xl px-4 py-6`
- 居中或两端：`© {year} {copyright} · Powered by Walle`
- 使用 `text-muted text-sm`

### 1.5 更新 `app/layout.tsx`

```tsx
<body className="min-h-screen flex flex-col bg-background text-text antialiased">
  <ThemedNavbar />
  <main className="mx-auto max-w-3xl px-4 py-10 flex-1 w-full">
    {children}
  </main>
  <ThemedFooter />
</body>
```

---

## Part 2：Profile 模块

### 2.1 扩展 `src/core/config.ts`

```ts
profile: {
  show: 'header-banner' as 'home-top' | 'home-bottom' | 'header-inline' | 'header-banner' | false,
  // 'home-top'      = 首页文章列表上方（独立卡片）
  // 'home-bottom'   = 首页文章列表下方（独立卡片）
  // 'header-inline' = 与导航栏合并：头像+名字+简介在左，导航链接在右（sticky）
  // 'header-banner' = 导航栏上方展示横幅（非 sticky），导航栏保持 sticky
  // false           = 不显示
  name: 'Your Name',
  bio: '',            // 一句话简介，留空则不显示
  avatar: '/assets/avatar.svg',  // public/assets/ 下的 URL，留空则不显示
  github: '',         // GitHub 主页 URL，留空不显示
  weibo: '',          // 微博主页 URL，留空不显示
  rss: false,         // 是否显示 RSS 订阅链接 /feed.xml
},
```

### 2.2 在 `src/core/types/index.ts` 新增类型

```ts
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ProfileProps {}
```

### 2.3 在 `src/core/ThemeResolver.tsx` 注册

```ts
export const ThemedProfile = dynamic<ProfileProps>(
  () => import(`../themes/${theme}/Profile`).catch(() => import("../themes/base/Profile"))
);
```

### 2.4 创建 `src/themes/base/Profile.tsx`

用于 `home-top` / `home-bottom` 模式的独立卡片：
- 外层容器：`flex items-center gap-5 rounded-lg border border-border bg-surface p-5 mb-8`
- 头像：`<Image>` 圆形，`w-16 h-16 rounded-full object-cover`
- 名字、简介、社交链接（GitHub / 微博 / RSS）

### 2.5 修改 `src/themes/base/Navbar.tsx`

Navbar 读取 `siteConfig.profile.show`，内部根据值选择渲染子组件：

- `header-inline`：`NavbarInline` — 头像+名字+简介在左，社交链接+导航在右（整体 sticky）
- `header-banner`：`NavbarBanner` — 顶部非 sticky 横幅 + 下方 sticky 导航栏
- 其余值：`NavbarDefault` — 原始站名+导航（不变）

### 2.6 在首页 `app/page.tsx` 中条件渲染

仅 `home-top` / `home-bottom` 时渲染 `<ThemedProfile />`，header 模式由 Navbar 自身处理：

```tsx
{(siteConfig.profile.show as string) === 'home-top' && <ThemedProfile />}
// ...文章列表...
{(siteConfig.profile.show as string) === 'home-bottom' && <ThemedProfile />}
```

> `app/posts/page/[page]/page.tsx`（分页列表）**不显示** Profile，只在首页第 1 页显示。

---

## 关键文件

| 文件 | 操作 |
|:---|:---|
| `src/core/config.ts` | 新增 `footer` 和 `profile` 配置块 |
| `src/core/types/index.ts` | 新增 `FooterProps`、`ProfileProps` |
| `src/core/ThemeResolver.tsx` | 注册 `ThemedFooter`、`ThemedProfile` |
| `src/themes/base/Footer.tsx` | 新建 Footer 实现 |
| `src/themes/base/Profile.tsx` | 新建 Profile 卡片实现（home-top/bottom 模式） |
| `src/themes/base/Navbar.tsx` | 扩展支持 header-inline / header-banner 模式 |
| `app/layout.tsx` | 插入 `<ThemedFooter />`，body 加 flex |
| `app/page.tsx` | 条件渲染 `<ThemedProfile />`（仅 home-* 模式） |
| `content/assets/avatar.svg` | Wall-E 风格头像 SVG |

---

## 验证

1. `npm run dev` 启动，所有页面底部显示 Footer 和版权信息
2. `profile.show = 'header-banner'`：顶部横幅显示头像+名字+简介+社交，下方 sticky 导航
3. `profile.show = 'header-inline'`：导航栏左侧显示头像+名字+简介
4. `profile.show = 'home-top'`：首页文章列表上方显示独立 Profile 卡片
5. `profile.show = false`：Profile 完全不显示
6. GitHub / 微博链接留空时不渲染，填写后显示
7. 短页面 Footer 粘底（`flex-1` on `<main>`）
