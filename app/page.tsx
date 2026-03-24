import { getPaginatedPosts } from "@/src/core/lib/posts";
import { ThemedPostCard, ThemedPagination } from "@/src/core/ThemeResolver";

export default async function HomePage() {
  const { posts, totalPages } = await getPaginatedPosts(1);

  return (
    <>
      <div>
        {posts.length === 0 ? (
          <p className="text-muted text-sm">暂无文章。</p>
        ) : (
          posts.map((post) => (
            <ThemedPostCard
              key={post.slug}
              slug={post.slug}
              title={post.title}
              date={post.date}
              summary={post.summary}
              tags={post.tags}
            />
          ))
        )}
      </div>

      <ThemedPagination current={1} total={totalPages} basePath="/posts/page" />
    </>
  );
}
