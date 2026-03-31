import { getPaginatedPosts } from "@/src/core/lib/posts";
import { ThemedPostCard, ThemedPagination, ThemedProfile } from "@/src/core/ThemeResolver";
import { siteConfig } from "@/src/core/config";

export default async function HomePage() {
  const { posts, totalPages } = await getPaginatedPosts(1);

  return (
    <>
      {(siteConfig.profile.show as string) === 'home-top' && <ThemedProfile />}
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
              category={post.category}
            />
          ))
        )}
      </div>

      <ThemedPagination current={1} total={totalPages} basePath="/posts/page" />
      {(siteConfig.profile.show as string) === 'home-bottom' && <ThemedProfile />}
    </>
  );
}
