import { notFound } from "next/navigation";
import { getPaginatedPosts } from "@/src/core/lib/posts";
import { ThemedPostCard, ThemedPagination } from "@/src/core/ThemeResolver";

interface Props {
  params: { page: string };
}

export async function generateStaticParams() {
  const { totalPages } = await getPaginatedPosts(1);
  return Array.from({ length: totalPages }, (_, i) => ({
    page: String(i + 1),
  }));
}

export default async function PaginatedPage({ params }: Props) {
  const page = Number(params.page);
  if (isNaN(page) || page < 1) notFound();

  const { posts, totalPages } = await getPaginatedPosts(page);
  if (posts.length === 0) notFound();

  return (
    <>
      <div>
        {posts.map((post) => (
          <ThemedPostCard
            key={post.slug}
            slug={post.slug}
            title={post.title}
            date={post.date}
            summary={post.summary}
            tags={post.tags}
          />
        ))}
      </div>

      <ThemedPagination current={page} total={totalPages} basePath="/posts/page" />
    </>
  );
}
