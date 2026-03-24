import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllCategories, getPostsByCategory } from "@/src/core/lib/posts";
import { ThemedPostCard, ThemedPagination } from "@/src/core/ThemeResolver";

interface Props {
  params: { category: string; page: string };
}

export async function generateStaticParams() {
  const categories = await getAllCategories();
  const params: { category: string; page: string }[] = [];

  for (const { name } of categories) {
    const { totalPages } = await getPostsByCategory(name, 1);
    for (let p = 2; p <= totalPages; p++) {
      params.push({ category: encodeURIComponent(name), page: String(p) });
    }
  }

  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = decodeURIComponent(params.category);
  return { title: `分类：${category}` };
}

export default async function CategoryPaginatedPage({ params }: Props) {
  const category = decodeURIComponent(params.category);
  const page = Number(params.page);
  if (isNaN(page) || page < 1) notFound();

  const { posts, totalPages } = await getPostsByCategory(category, page);
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
        current={page}
        total={totalPages}
        basePath={`/categories/${params.category}/page`}
      />
    </>
  );
}
