import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';
import { siteConfig } from '../config';
import type { Post, GroupedArchive } from '../types';

const POSTS_DIR = path.join(process.cwd(), 'content/posts');

// 将文件名（不含扩展名）作为 slug
function fileToSlug(filename: string): string {
  return filename.replace(/\.md$/, '');
}

// 日期优先级：Frontmatter date > 文件 mtime
function resolvePostDate(frontmatterDate: unknown, filePath: string): Date {
  if (frontmatterDate) {
    const d = new Date(frontmatterDate as string);
    if (!isNaN(d.getTime())) return d;
  }
  return fs.statSync(filePath).mtime;
}

// rehype 插件：将 mermaid 代码块渲染为内联 SVG
function rehypeMermaid() {
  return () => async (tree: Root) => {
    // 先同步收集所有 mermaid 节点（visit 是同步的）
    const mermaidNodes: { node: Element; index: number; parent: Element }[] = [];
    visit(tree, 'element', (node, index, parent) => {
      const el = node as Element;
      if (el.tagName !== 'pre' || !parent || index == null) return;
      const code = el.children[0] as Element;
      if (
        code?.tagName !== 'code' ||
        !String(code.properties?.className ?? '').includes('language-mermaid')
      ) return;
      mermaidNodes.push({ node: el, index, parent: parent as Element });
    });

    if (mermaidNodes.length === 0) return;

    // 使用动态 import() 而非静态 import，确保在 tsx（CJS 模式）运行时也能正确解析
    // ESM-only 包的 `import` 导出条件，避免 ERR_PACKAGE_PATH_NOT_EXPORTED。
    const { renderMermaidSVG } = await import('beautiful-mermaid');

    for (const { node, index, parent } of mermaidNodes) {
      const code = node.children[0] as Element;
      const text = code.children
        .filter((c) => c.type === 'text')
        .map((c) => (c as { value: string }).value)
        .join('');
      try {
        const svg = renderMermaidSVG(text, { transparent: true, padding: 24 });
        const wrapper: Element = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['mermaid-diagram'] },
          children: [{ type: 'raw', value: svg } as never],
        };
        parent.children.splice(index, 1, wrapper);
      } catch {
        // fallback：保留原始代码块
      }
    }
  };
}

// rehype 插件：将相对路径图片统一规范化为绝对路径，并补全 basePath
// ../assets/foo.png      →  /assets/foo.png（本地）
// ../assets/2026/foo.png →  /Walle/assets/2026/foo.png（GitHub Pages）
function rehypeAssetPath(basePath: string) {
  return () => (tree: Root) => {
    visit(tree, 'element', (node) => {
      const el = node as Element;
      if (
        el.tagName === 'img' &&
        typeof el.properties?.src === 'string'
      ) {
        let src = el.properties.src;
        if (src.startsWith('../assets/')) {
          src = src.replace(/^\.\.\/assets\//, '/assets/');
        }
        if (basePath && src.startsWith('/')) {
          src = `${basePath}${src}`;
        }
        el.properties.src = src;
      }
    });
  };
}

// Markdown → HTML（含代码高亮）
async function markdownToHtml(content: string): Promise<string> {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  const result = await remark()
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeMermaid())
    .use(rehypeHighlight)
    .use(rehypeAssetPath(basePath))
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(content);
  return result.toString();
}

export async function getAllPosts(): Promise<Post[]> {
  if (!fs.existsSync(POSTS_DIR)) return [];

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));

  const posts = await Promise.all(
    files.map(async (filename) => {
      const filePath = path.join(POSTS_DIR, filename);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data, content: rawContent } = matter(fileContent);

      const date = resolvePostDate(data.date, filePath);
      const content = await markdownToHtml(rawContent);
      const summary: string =
        data.summary ?? rawContent.replace(/^#+\s.*$/gm, '').trim().slice(0, 200);

      return {
        slug: fileToSlug(filename),
        title: (data.title as string) ?? fileToSlug(filename),
        date: date.toISOString(),
        summary,
        tags: (data.tags as string[]) ?? [],
        category: (data.category as string) ?? '',
        content,
        rawContent,
      } satisfies Post;
    })
  );

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const posts = await getAllPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

export async function getGroupedArchives(): Promise<GroupedArchive[]> {
  const posts = await getAllPosts();

  const map = new Map<number, GroupedArchive['posts']>();
  for (const post of posts) {
    const year = new Date(post.date).getFullYear();
    if (!map.has(year)) map.set(year, []);
    map.get(year)!.push({ slug: post.slug, title: post.title, date: post.date });
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => b - a)
    .map(([year, posts]) => ({ year, posts }));
}

export async function getPaginatedPosts(
  page: number
): Promise<{ posts: Post[]; total: number; totalPages: number }> {
  const all = await getAllPosts();
  const { postsPerPage } = siteConfig;
  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / postsPerPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const posts = all.slice((safePage - 1) * postsPerPage, safePage * postsPerPage);
  return { posts, total, totalPages };
}

export async function getAllTags(): Promise<{ name: string; count: number }[]> {
  const posts = await getAllPosts();
  const map = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) {
      map.set(tag, (map.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getAllCategories(): Promise<{ name: string; count: number }[]> {
  const posts = await getAllPosts();
  const map = new Map<string, number>();
  for (const post of posts) {
    if (post.category) {
      map.set(post.category, (map.get(post.category) ?? 0) + 1);
    }
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getPostsByTag(
  tag: string,
  page: number
): Promise<{ posts: Post[]; total: number; totalPages: number }> {
  const all = await getAllPosts();
  const filtered = all.filter((p) => p.tags.includes(tag));
  const { postsPerPage } = siteConfig;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / postsPerPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const posts = filtered.slice((safePage - 1) * postsPerPage, safePage * postsPerPage);
  return { posts, total, totalPages };
}

export async function getPostsByCategory(
  category: string,
  page: number
): Promise<{ posts: Post[]; total: number; totalPages: number }> {
  const all = await getAllPosts();
  const filtered = all.filter((p) => p.category === category);
  const { postsPerPage } = siteConfig;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / postsPerPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const posts = filtered.slice((safePage - 1) * postsPerPage, safePage * postsPerPage);
  return { posts, total, totalPages };
}
