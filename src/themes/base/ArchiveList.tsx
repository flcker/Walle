import Link from "next/link";
import type { GroupedArchive } from "@/src/core/types";

interface Props {
  archives: GroupedArchive[];
}

export default function ArchiveList({ archives }: Props) {
  if (archives.length === 0) {
    return <p className="text-muted text-sm">暂无文章。</p>;
  }

  return (
    <div className="space-y-8">
      {archives.map(({ year, posts }) => (
        <section key={year}>
          <h2 className="mb-3 text-xl font-bold text-text">{year}</h2>
          <ul className="space-y-2">
            {posts.map((post) => {
              const dateStr = new Date(post.date).toLocaleDateString("zh-CN", {
                month: "2-digit",
                day: "2-digit",
              });
              return (
                <li key={post.slug} className="flex items-baseline gap-3">
                  <time className="w-12 shrink-0 text-sm text-muted">{dateStr}</time>
                  <Link
                    href={`/posts/${post.slug}`}
                    className="text-text hover:text-primary transition-colors"
                  >
                    {post.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
