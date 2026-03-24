import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllTags, getPostsByTag } from "@/src/core/lib/posts";
import { ThemedPostCard, ThemedPagination } from "@/src/core/ThemeResolver";

interface Props {
  params: { tag: string };
}

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map(({ name }) => ({
    tag: encodeURIComponent(name),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tag = decodeURIComponent(params.tag);
  return { title: `标签：${tag}` };
}

export default async function TagPage({ params }: Props) {
  const tag = decodeURIComponent(params.tag);
  const { posts, totalPages } = await getPostsByTag(tag, 1);

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
        current={1}
        total={totalPages}
        basePath={`/tags/${params.tag}/page`}
      />
    </>
  );
}
