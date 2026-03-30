import fs from "fs";
import path from "path";
import { getAllPosts } from "../src/core/lib/posts";
import type { SearchIndexItem } from "../src/core/types";

async function main() {
  console.log("[walle] 生成搜索索引...");

  const posts = await getAllPosts();

  const index: SearchIndexItem[] = posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    date: post.date,
    tags: post.tags,
    category: post.category,
    summary: post.summary,
  }));

  const outPath = path.join(process.cwd(), "public", "search-index.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(index), "utf-8");

  console.log(`[walle] 索引生成完毕：${index.length} 篇文章 → public/search-index.json`);

  // 将 content/assets/ 递归同步到 public/assets/（支持子路径）
  const assetsDir = path.join(process.cwd(), 'content', 'assets');
  const publicAssetsDir = path.join(process.cwd(), 'public', 'assets');
  if (fs.existsSync(assetsDir)) {
    fs.cpSync(assetsDir, publicAssetsDir, { recursive: true });
    console.log('[walle] 图片资源已同步：content/assets/ → public/assets/');
  }
}

main().catch((err) => {
  console.error("[walle] 搜索索引生成失败:", err);
  process.exit(1);
});
