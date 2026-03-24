# 计划：添加分类（Categories）和标签（Tags）功能

## Context

当前博客的 `content` 目录只有 `posts`，文章虽然支持 `tags` 字段，但没有对应的浏览页面，也没有 `category`（分类）字段。需要：
1. 在数据层新增 `category` 字段支持
2. 添加 `/categories` 和 `/tags` 列表页
3. 添加 `/categories/[category]` 和 `/tags/[tag]` 文章过滤页（带分页）
4. 在导航栏添加入口，在文章卡片和详情页展示可点击的分类/标签

---

## 实施步骤

### Step 1：数据层 & 类型（基础，其余步骤依赖此步）

**文件：`src/core/types/index.ts`**
- `Post` 接口新增 `category: string`
- `PostCardProps` 新增 `category: string`
- `SearchIndexItem` 新增 `category: string`
- 新增 `TagListProps`：`{ tags: { name: string; count: number }[] }`
- 新增 `CategoryListProps`：`{ categories: { name: string; count: number }[] }`

**文件：`src/core/lib/posts.ts`**
- `getAllPosts()` 的 map 内增加 `category: (data.category as string) ?? ''`
- 追加 4 个新函数：
  ```ts
  getAllTags(): Promise<{ name: string; count: number }[]>
  getAllCategories(): Promise<{ name: string; count: number }[]>
  getPostsByTag(tag: string, page: number): Promise<{ posts, total, totalPages }>
  getPostsByCategory(category: string, page: number): Promise<{ posts, total, totalPages }>
  ```

**验证：** TypeScript 编译无报错（`npx tsc --noEmit`）

---

### Step 2：主题组件注册

**文件：`src/core/ThemeResolver.tsx`**
- 导入 `TagListProps`、`CategoryListProps`
- 追加注册：
  ```ts
  export const ThemedTagList = dynamic<TagListProps>(...)
  export const ThemedCategoryList = dynamic<CategoryListProps>(...)
  ```

**文件：`src/themes/base/TagList.tsx`**（新建）
- 标签云，`rounded-full border border-border bg-surface` 样式
- 每项：标签名 + `(count)`，点击跳转 `/tags/[encodeURIComponent(name)]`

**文件：`src/themes/base/CategoryList.tsx`**（新建）
- 带 `divide-y divide-border` 的列表
- 每行：左侧分类名，右侧文章数，点击跳转 `/categories/[encodeURIComponent(name)]`

**验证：** TypeScript 编译无报错

---

### Step 3：导航栏更新

**文件：`src/themes/base/Navbar.tsx`**
- 在 `归档` 链接后、`<NavbarClient />` 前，新增：
  ```tsx
  <Link href="/categories" className="hover:text-primary transition-colors">分类</Link>
  <Link href="/tags" className="hover:text-primary transition-colors">标签</Link>
  ```

**验证：** `npm run dev` 后导航栏出现"分类"和"标签"链接

---

### Step 4：文章卡片 & 详情页更新

**文件：`src/themes/base/PostCard.tsx`**
- Props 改用 `PostCardProps`（已含 `category`）
- `<time>` 同行右侧新增分类 Link（条件渲染：`{category && ...}`）
- 标签由 `<span>` 改为 `<Link href={/tags/encodeURIComponent(tag)}>`

**文件：`app/posts/[slug]/page.tsx`**
- `<time>` 下方新增分类 Link
- 标签由 `<span>` 改为 `<Link>`（已有 `import Link`，无需新增）

**文件：`app/page.tsx`**
- `<ThemedPostCard>` 补传 `category={post.category}`

**文件：`app/posts/page/[page]/page.tsx`**
- `<ThemedPostCard>` 补传 `category={post.category}`

**验证：** 首页文章卡片和文章详情页中，分类和标签均可点击跳转

---

### Step 5：分类路由页面

**文件：`app/categories/page.tsx`**（新建）
```tsx
// Server Component
// metadata: { title: "分类" }
// getAllCategories() → <ThemedCategoryList categories={...} />
```

**文件：`app/categories/[category]/page.tsx`**（新建）
```tsx
// generateStaticParams: getAllCategories() → { category: encodeURIComponent(name) }
// getPostsByCategory(decodeURIComponent(params.category), 1)
// 渲染文章列表 + ThemedPagination basePath={`/categories/${params.category}/page`}
// posts 为空 → notFound()
```

**文件：`app/categories/[category]/page/[page]/page.tsx`**（新建）
```tsx
// generateStaticParams: 枚举所有分类 × page 从 2 到 totalPages
// 逻辑同上，page 从 Number(params.page) 读取
```

**验证：**
- 访问 `/categories` 显示分类列表
- 点击分类跳转到 `/categories/技术`，显示该分类文章

---

### Step 6：标签路由页面

**文件：`app/tags/page.tsx`**（新建）
```tsx
// metadata: { title: "标签" }
// getAllTags() → <ThemedTagList tags={...} />
```

**文件：`app/tags/[tag]/page.tsx`**（新建）
```tsx
// generateStaticParams: getAllTags() → { tag: encodeURIComponent(name) }
// getPostsByTag(decodeURIComponent(params.tag), 1)
// 渲染文章列表 + ThemedPagination basePath={`/tags/${params.tag}/page`}
```

**文件：`app/tags/[tag]/page/[page]/page.tsx`**（新建）
```tsx
// generateStaticParams: 枚举所有标签 × page 从 2 到 totalPages
```

**验证：**
- 访问 `/tags` 显示标签云
- 点击标签跳转到 `/tags/Next.js`，显示该标签文章

---

### Step 7：搜索索引同步

**文件：`scripts/build-search-index.ts`**
- 索引对象增加 `category: post.category`

**验证：** `npm run build` 后 `public/search-index.json` 每条记录含 `category` 字段

---

## Frontmatter 格式更新

```markdown
---
title: 文章标题
date: 2026-03-24
summary: 摘要
category: 技术        # 新增，单个分类
tags: [Next.js, React]
---
```

> `category` 为可选字段，未填写时默认为空字符串，不影响现有文章。

---

## 关键设计决策

| 决策 | 原因 |
|:---|:---|
| URL 编码：`encodeURIComponent` 生成参数，`decodeURIComponent` 还原 | 支持中文分类/标签名 |
| 分页复用 `ThemedPagination`，仅传 `basePath` | 与 `/posts/page/[page]` 架构一致，无需新建分页组件 |
| `category` 默认空字符串而非 `undefined` | 类型简单，组件内 `{category && ...}` 条件渲染更直接 |
| 仅使用语义色彩类 | 遵守项目样式规范，自动支持深色模式 |

---

## 完整验证清单

### 开发验证（`npm run dev`）
- [ ] 导航栏出现"分类"和"标签"两个链接
- [ ] `/categories` 页面正常显示分类列表
- [ ] `/tags` 页面正常显示标签云
- [ ] `/categories/技术` 显示该分类下的文章
- [ ] `/tags/walle` 显示该标签下的文章
- [ ] 首页文章卡片：分类链接可点击，标签链接可点击
- [ ] 文章详情页：分类链接可点击，标签链接可点击
- [ ] 分类/标签页面的分页（如文章数超过 `postsPerPage`）正常工作
- [ ] 中文分类名（如"技术"）URL 编解码正常

### 构建验证（`npm run build`）
- [ ] 无 TypeScript 编译报错
- [ ] 无 Next.js 构建报错（所有动态路由均已 `generateStaticParams`）
- [ ] `public/search-index.json` 含 `category` 字段

### 端到端验证
1. 在 `content/posts/hello-walle.md` 的 frontmatter 中加入 `category: 测试`
2. 重启 dev server，访问 `/categories` 确认"测试"分类出现
3. 点击"测试"分类，确认跳转到 `/categories/%E6%B5%8B%E8%AF%95` 并显示对应文章
