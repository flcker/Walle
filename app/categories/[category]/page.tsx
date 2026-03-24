import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllCategories, getPostsByCategory } from "@/src/core/lib/posts";
import { ThemedPostCard, ThemedPagination } from "@/src/core/ThemeResolver";

interface Props {
  params: { category: string };
}

export async function generateStaticParams() {
  const categories = await getAllCategories();
  return categories.map(({ name }) => ({
    category: encodeURIComponent(name),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = decodeURIComponent(params.category);
  return { title: `分类：${category}` };
}

export default async function CategoryPage({ params }: Props) {
  const category = decodeURIComponent(params.category);
  const { posts, totalPages } = await getPostsByCategory(category, 1);

  if (posts.length === 0) notFound();

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold text-text">
        分类：<span className="text-primary">{category}</span>
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
        basePath={`/categories/${params.category}/page`}
      />
    </>
  );
}
