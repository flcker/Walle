import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllTags, getPostsByTag } from "@/src/core/lib/posts";
import { ThemedPostCard, ThemedPagination } from "@/src/core/ThemeResolver";

interface Props {
  params: { tag: string; page: string };
}

export async function generateStaticParams() {
  const tags = await getAllTags();
  const params: { tag: string; page: string }[] = [];

  for (const { name } of tags) {
    const { totalPages } = await getPostsByTag(name, 1);
    for (let p = 1; p <= totalPages; p++) {
      params.push({ tag: encodeURIComponent(name), page: String(p) });
    }
  }

  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tag = decodeURIComponent(params.tag);
  return { title: `标签：${tag}` };
}

export default async function TagPaginatedPage({ params }: Props) {
  const tag = decodeURIComponent(params.tag);
  const page = Number(params.page);
  if (isNaN(page) || page < 1) notFound();

  const { posts, totalPages } = await getPostsByTag(tag, page);
  if (posts.length === 0) notFound();

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold text-text">
        标签：<span className="text-primary">{tag}</span>
      </h1>
      <div>
        {posts.map((post) => (
          <ThemedPostCard
            key={post.slug}
            slug={post.slug}
            title={post.title}
            date={post.date}
            summary={post.summary}
            tags={post.tags}
            category={post.category}
          />
        ))}
      </div>
      <ThemedPagination
        current={page}
        total={totalPages}
        basePath={`/tags/${params.tag}/page`}
      />
    </>
  );
}
