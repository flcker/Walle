import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/src/core/lib/posts";
import type { Metadata } from "next";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) return {};
  return { title: post.title, description: post.summary };
}

export default async function PostPage({ params }: Props) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  const dateStr = new Date(post.date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="prose prose-neutral max-w-none dark:prose-invert">
      <header className="mb-8 not-prose">
        <h1 className="text-3xl font-bold text-text">{post.title}</h1>
        <time className="mt-2 block text-sm text-muted">{dateStr}</time>
        {post.category && (
          <Link
            href={`/categories/${encodeURIComponent(post.category)}`}
            className="mt-1 inline-block text-xs text-primary hover:opacity-80 transition-colors"
          >
            {post.category}
          </Link>
        )}
        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag)}`}
                className="rounded-full bg-surface px-2.5 py-0.5 text-xs text-muted hover:text-primary transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
      </header>

      <div
        className="text-text leading-relaxed"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  );
}
