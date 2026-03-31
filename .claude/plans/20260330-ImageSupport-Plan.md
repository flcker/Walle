# 图片支持功能计划

**日期**：2026-03-30
**状态**：✅ 已完成

## 目标

为 Markdown 文章添加图片引用支持，同时满足：

1. Markdown 编辑器本地预览可正常显示图片
2. `npm run build` 后图片路径正确（含 GitHub Pages basePath）

## 决策

| 项目 | 决策 |
|:---|:---|
| `content/posts/` | **不支持子目录**，保持平铺结构 |
| `content/assets/` | **支持任意子路径**，作者可自由组织 |
| Markdown 写法 | 使用相对路径 `../assets/`，兼顾预览与构建 |

## 目录约定

```
content/
├── posts/
│   ├── hello-world.md     ← 文章（不含子目录）
│   └── another-post.md
└── assets/                ← 所有图片统一放这里
    ├── hello-banner.png   ← 直接放
    ├── 2026/              ← 或按年份/主题组织子目录
    │   └── screenshot.png
    └── diagrams/
        └── arch.svg
```

## 使用方法

### 在文章中引用图片

```markdown
<!-- 引用 content/assets/ 根目录的图片 -->
![图片说明](../assets/hello-banner.png)

<!-- 引用子目录图片 -->
![架构图](../assets/diagrams/arch.svg)
![截图](../assets/2026/screenshot.png)
```

### 工作流程

1. 将图片放入 `content/assets/`（或其子目录）
2. 在 Markdown 中用 `../assets/` 相对路径引用
3. 编辑器（VS Code、Typora、Obsidian 等）预览直接可用
4. 发布前执行 `npm run build`，自动完成：
   - `content/assets/` → `public/assets/`（递归复制）
   - 图片路径规范化（`../assets/` → `/assets/`）
   - basePath 补全（GitHub Pages 子路径部署时）

> 本地 `npm run dev` 不自动执行 prebuild。新增图片后需先运行 `npm run prebuild`，再启动 dev server。

## 实现方案

### 构建脚本（`scripts/build-search-index.ts`）

在现有搜索索引生成脚本的 `main()` 末尾追加图片同步逻辑：

```typescript
const assetsDir = path.join(process.cwd(), 'content', 'assets');
const publicAssetsDir = path.join(process.cwd(), 'public', 'assets');
if (fs.existsSync(assetsDir)) {
  fs.cpSync(assetsDir, publicAssetsDir, { recursive: true });
  console.log('[walle] 图片资源已同步：content/assets/ → public/assets/');
}
```

### rehype 插件（`src/core/lib/posts.ts`）

在 Markdown → HTML 管线中插入路径规范化插件：

```
../assets/foo.png  →（规范化）→  /assets/foo.png  →（basePath）→  /Walle/assets/foo.png
```

仅处理 `../assets/` 开头的相对路径，`https://` 等外部链接不受影响。

### 样式（`app/globals.css`）

```css
.prose img {
  max-width: 100%;
  height: auto;
  border-radius: 0.375rem;
}
```

## 验证方式

### 端到端验证步骤

1. **准备测试图片**：将任意图片放入 `content/assets/`，另一张放入子目录如 `content/assets/2026/`

2. **编辑器预览验证**：在 `content/posts/hello-walle.md` 添加：
   ```markdown
   ![测试图片](../assets/test.png)
   ![子目录图片](../assets/2026/test.png)
   ```
   在编辑器中打开，确认两张图片均可预览

3. **本地构建验证**：
   ```bash
   npm run prebuild
   # 确认输出：[walle] 图片资源已同步：content/assets/ → public/assets/
   # 确认 public/assets/ 目录结构与 content/assets/ 一致（含子目录）
   ```

4. **本地开发验证**：
   ```bash
   npm run dev
   # 访问 http://localhost:3000/posts/hello-walle
   # 确认图片正常显示，无 404
   ```

5. **basePath 构建验证**：
   ```bash
   NEXT_PUBLIC_BASE_PATH=/Walle npm run build
   # 在 out/posts/hello-walle/index.html 中搜索 img src
   # 确认 src="/Walle/assets/test.png"（含 basePath 前缀）
   # 确认 src="/Walle/assets/2026/test.png"（子目录路径也正确）
   ```

6. **外部链接验证**：文章中加入 `![外部](https://example.com/img.png)`，确认构建后 src 未被修改

## 已变更文件

| 文件 | 变更内容 |
|:---|:---|
| `content/assets/.gitkeep` | 新建，跟踪图片目录 |
| `scripts/build-search-index.ts` | 追加 `content/assets/` → `public/assets/` 递归同步 |
| `src/core/lib/posts.ts` | 新增 `rehypeAssetPath` 插件 + 更新 `markdownToHtml` pipeline |
| `app/globals.css` | 追加 `.prose img` 响应式样式 |
| `content/posts/hello-walle.md` | 添加图片示例章节（验证用） |
| `content/assets/walle-logo.svg` | 测试图片（根目录） |
| `content/assets/screenshots/code-highlight.svg` | 测试图片（子目录） |

## 路径转换对照

| Markdown 写法 | 编辑器预览解析路径 | 本地 dev URL | GitHub Pages URL |
|:---|:---|:---|:---|
| `../assets/foo.png` | `content/assets/foo.png` ✅ | `/assets/foo.png` | `/Walle/assets/foo.png` |
| `../assets/2026/foo.png` | `content/assets/2026/foo.png` ✅ | `/assets/2026/foo.png` | `/Walle/assets/2026/foo.png` |
| `https://example.com/a.png` | 外部链接 ✅ | 不处理 | 不处理 |
