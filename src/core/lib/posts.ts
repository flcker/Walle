import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
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
    .use(remarkRehype)
    .use(rehypeHighlight)
    .use(rehypeAssetPath(basePath))
    .use(rehypeStringify)
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
