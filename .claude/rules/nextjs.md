# Next.js 开发规范

## 组件边界规则

### Server Component（默认）
- 所有页面（`app/**\/page.tsx`）和布局（`layout.tsx`）默认为 Server Component
- 在 Server Component 中执行数据获取（`getAllPosts()`、`getPostBySlug()` 等）
- 不得在 Server Component 中使用 `useState`、`useEffect`、事件处理器

### Client Component
- 需要交互状态的部分拆分为独立的 `*Client.tsx` 文件
- 文件顶部必须标注 `"use client"`
- 示例：`NavbarClient.tsx`（控制搜索弹窗开关）

### 边界拆分模式

```
Navbar.tsx          ← Server Component（静态导航链接）
  └── NavbarClient.tsx  ← Client Component（搜索按钮 & 弹窗状态）
        └── SearchModal  ← dynamic({ ssr: false }) 懒加载
```

## 动态组件加载

重型客户端组件必须懒加载，避免影响首屏：

```tsx
// ✅ 正确：ssr: false + 首次需要时才加载
const SearchModal = dynamic(() => import("./SearchModal"), { ssr: false });

// ❌ 错误：直接 import 会影响包体积
import SearchModal from "./SearchModal";
```

## 路由结构

```
app/
├── page.tsx                              # 首页（第一页文章列表）
├── layout.tsx                            # 全局布局（Navbar + 字体 + 样式）
├── globals.css                           # CSS 变量 + 全局样式
├── archives/
│   └── page.tsx                          # 归档页（按年分组 + 日历）
├── posts/
│   ├── [slug]/page.tsx                   # 文章详情页
│   └── page/[page]/page.tsx              # 文章分页列表
├── categories/
│   ├── page.tsx                          # 分类列表页
│   └── [category]/
│       ├── page.tsx                      # 分类文章（第 1 页）
│       └── page/[page]/page.tsx          # 分类文章分页
└── tags/
    ├── page.tsx                          # 标签列表页
    └── [tag]/
        ├── page.tsx                      # 标签文章（第 1 页）
        └── page/[page]/page.tsx          # 标签文章分页
```

## 静态生成要求

- 所有页面必须能静态导出（`output: 'export'`），禁止使用需要 Node.js 运行时的 API
- 动态路由必须实现 `generateStaticParams()` 预生成所有路径
- 使用 `generateMetadata()` 为每个页面提供独立的 `<title>` 和 `<meta description>`
- 禁止使用 `getServerSideProps`（SSG 模式不支持）

## basePath 处理

GitHub Pages 子路径部署时 `basePath` 由 CI 注入，本地开发不设置：

```js
// next.config.mjs
...(process.env.NEXT_PUBLIC_BASE_PATH
  ? { basePath: process.env.NEXT_PUBLIC_BASE_PATH }
  : {}),
```

- 内部链接使用 Next.js `<Link>` 组件，自动处理 `basePath`
- 禁止手动拼接 `basePath` 到链接字符串

## 图片处理

`next/image` 已配置 `unoptimized: true`（静态导出限制），可正常使用 `<Image>` 组件。

**站点资源（头像等）的 basePath 问题：** `unoptimized: true` 时 `<Image>` 不会自动给 `src` 加 basePath 前缀。`/assets/` 下的站点资源须通过 `assetUrl()` 处理：

```tsx
import { assetUrl } from "@/src/core/config";
// ✅ 正确
<Image src={assetUrl(profile.avatar)} ... />
// ❌ 错误：在 GitHub Pages 子路径下会 404
<Image src={profile.avatar} ... />
```

`assetUrl()` 读取 `NEXT_PUBLIC_BASE_PATH` 环境变量并拼接前缀，本地开发无 basePath 时行为不变。
