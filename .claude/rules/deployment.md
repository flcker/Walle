# 部署规范

## GitHub Actions 自动部署

部署流程由 `.github/workflows/deploy.yml` 管理，推送 `main` 分支自动触发。

### 前置配置

在 GitHub 仓库中设置 Repository Variable：

| Variable | 值 | 说明 |
|:---|:---|:---|
| `NEXT_PUBLIC_BASE_PATH` | `/your-repo-name` | 子路径（用户主页仓库留空） |

> 用户主页仓库（`username.github.io`）不需要设置此变量。

### 构建步骤

```
checkout（fetch-depth: 0）
  → setup Node.js 20
  → npm ci（working-directory: Walle）
  → npm run build（注入 NEXT_PUBLIC_BASE_PATH）
  → upload-pages-artifact（上传 Walle/out）
  → deploy-pages
```

### `fetch-depth: 0` 的作用

保留完整 Git 历史，为将来支持"读取文章首次提交时间作为日期回退"的 Phase 7 扩展做准备。

## 本地构建验证

```bash
# 模拟 CI 环境构建
NEXT_PUBLIC_BASE_PATH=/your-repo-name npm run build

# 构建产物位于 out/ 目录
# 用任意静态服务器预览：
npx serve out
```

## 部署注意事项

- `out/` 目录不提交到 Git（已在 `.gitignore` 中忽略）
- `public/search-index.json` 由 `prebuild` 自动生成，不需要手动维护
- 修改 GitHub Pages 设置时确认 Source 为 "GitHub Actions"（不是 branch）
- 并发控制：同一时间只允许一个部署任务，新推送会取消旧任务（`cancel-in-progress: true`）
