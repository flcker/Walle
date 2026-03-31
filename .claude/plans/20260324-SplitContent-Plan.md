# 内容仓库分离部署计划

将 `content/` 目录迁移至独立 Git 仓库，内容仓库推送后通过 `repository_dispatch` 自动触发博客重新构建部署。

---

## 前置说明

### 仓库角色

| 仓库 | 说明 |
|:---|:---|
| `blog-code`（当前仓库） | Next.js 源码 + GitHub Actions 部署 |
| `blog-content`（新建） | 仅存放 `content/posts/*.md` 文章文件 |

### 触发流程

```
blog-content push to main
  → notify.yml 调用 GitHub API
    → blog-code 收到 repository_dispatch
      → deploy.yml 构建并部署至 GitHub Pages
```

---

## Phase 1 — 准备内容仓库

**目标**：将 `content/` 目录迁移至新仓库，保留文章历史。

**验收标准**：新仓库可正常访问，结构为 `content/posts/*.md`。

---

### Step 1.1 创建内容仓库

在 GitHub 新建仓库 `blog-content`（可设为私有），保持目录结构：

```
blog-content/
└── content/
    └── posts/
        └── *.md
```

---

### Step 1.2 迁移文章文件

```prompt
将当前仓库 content/ 目录下的所有文件迁移至 blog-content 仓库。
在 blog-content 根目录保持相同目录结构：content/posts/。
提交并推送至 blog-content 的 main 分支。
```

---

### Step 1.3 从 blog-code 移除 content 目录

```prompt
从 blog-code 仓库删除 content/ 目录（文章已迁移至 blog-content）。
在 .gitignore 中添加 content/，避免误提交。
提交此次删除。
```

---

## Phase 2 — 配置 GitHub PAT

**目标**：为 blog-content 仓库授权，使其可以触发 blog-code 的 Actions。

**验收标准**：blog-content 的 Secret 中存在 `BLOG_REPO_TOKEN`。

---

### Step 2.1 生成 PAT

在 GitHub **Settings → Developer settings → Personal access tokens → Fine-grained tokens** 中生成一个新 Token：

- **Repository access**：仅选择 `blog-code` 仓库
- **Permissions → Actions**：选择 `Read and write`（用于触发 `repository_dispatch`）

---

### Step 2.2 添加 Secret 至内容仓库

在 `blog-content` 仓库的 **Settings → Secrets and variables → Actions** 中新建：

| Name | Value |
|:---|:---|
| `BLOG_REPO_TOKEN` | 上一步生成的 PAT |

---

## Phase 3 — 内容仓库添加 notify.yml

**目标**：内容仓库 push 到 main 时，自动通知 blog-code 重新构建。

**验收标准**：推送文章后，blog-code 的 Actions 页面出现新的构建任务。

---

### Step 3.1 创建 notify.yml

```prompt
在 blog-content 仓库创建 .github/workflows/notify.yml，内容如下：

触发条件：push 到 main 分支。

步骤：
  - 使用 curl 向 blog-code 仓库发送 repository_dispatch 事件
  - Authorization Header 使用 secrets.BLOG_REPO_TOKEN
  - event_type 设置为 "content-updated"
  - Accept Header 设置为 "application/vnd.github+json"

注意：将 URL 中的用户名和仓库名替换为实际值。
```

完整文件内容：

```yaml
name: Notify blog to rebuild

on:
  push:
    branches: [main]

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger blog-code deploy
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.BLOG_REPO_TOKEN }}" \
            -H "Accept: application/vnd.github+json" \
            -H "Content-Type: application/json" \
            https://api.github.com/repos/你的用户名/blog-code/dispatches \
            -d '{"event_type":"content-updated"}'
```

---

## Phase 4 — 修改 blog-code 的构建流程

**目标**：blog-code 在构建时从 blog-content 拉取最新文章，并响应 `repository_dispatch` 触发。

**验收标准**：手动触发 `repository_dispatch` 后，博客构建成功且包含最新文章。

---

### Step 4.1 更新 deploy.yml 触发条件

```prompt
修改 blog-code 的 .github/workflows/deploy.yml：

在 on 块新增 repository_dispatch 触发：
  repository_dispatch:
    types: [content-updated]

保留原有的 push 触发条件不变。
```

---

### Step 4.2 构建时 Clone 内容仓库

```prompt
在 deploy.yml 的 build job 中，Checkout 步骤之后、Install dependencies 之前，
新增一个步骤：

- name: Clone content repository
  run: git clone https://github.com/你的用户名/blog-content.git content-repo
        && cp -r content-repo/content ./Walle/content

注意：
- 如果 blog-content 是私有仓库，需使用带 token 的 clone URL 或配置 Deploy Key。
- clone 目标路径须与 posts.ts 中 POSTS_DIR 使用的 process.cwd()/content/posts 保持一致。
```

完整步骤示例（公开仓库）：

```yaml
- name: Clone content repository
  run: |
    git clone https://github.com/你的用户名/blog-content.git _content
    cp -r _content/content ./Walle/content
```

---

### Step 4.3 私有内容仓库的处理（可选）

如果 `blog-content` 设为私有，clone 时需鉴权：

```prompt
在 blog-code 的 Actions Secrets 中新建 CONTENT_REPO_TOKEN（同一个 PAT 即可，
需要对 blog-content 有 contents: read 权限）。

将 clone 命令改为：
  git clone https://x-access-token:${{ secrets.CONTENT_REPO_TOKEN }}@github.com/你的用户名/blog-content.git _content
```

---

## Phase 5 — 验证

**目标**：端到端验证完整流程。

---

### Step 5.1 验证触发链路

```
1. 在 blog-content/content/posts/ 新增或修改一篇文章
2. 提交并推送至 main 分支
3. 检查 blog-content 的 Actions 页面，confirm notify.yml 成功执行（curl 返回 204）
4. 检查 blog-code 的 Actions 页面，confirm 出现新的构建任务
5. 等待构建完成，访问 GitHub Pages 确认文章已更新
```

---

### Step 5.2 验证代码仓库单独触发

```
1. 修改 blog-code 源码（如 siteConfig），推送至 main
2. 确认 deploy.yml 正常触发（不依赖 blog-content）
3. 构建时仍能从 blog-content clone 到最新内容
```

---

## 实施顺序总览

```
Phase 1（迁移内容）
  → Phase 2（配置 PAT）
    → Phase 3（notify.yml）
      → Phase 4（更新 deploy.yml）
        → Phase 5（端到端验证）
```

各步骤均可独立回滚：如需恢复，将 content/ 目录重新加入 blog-code 仓库，并还原 deploy.yml 即可。
