import Link from "next/link";
import type { PostCardProps } from "@/src/core/types";

export default function PostCard({ slug, title, date, summary, tags, category }: PostCardProps) {
  const dateStr = new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="border-b border-border py-6 last:border-none">
      <Link href={`/posts/${slug}`} className="group block">
        <h2 className="text-xl font-semibold text-text group-hover:text-primary transition-colors">
          {title}
        </h2>
      </Link>

      <time className="mt-1 block text-sm text-muted">{dateStr}</time>

      {category && (
        <Link
          href={`/categories/${encodeURIComponent(category)}`}
          className="mt-1 inline-block text-xs text-primary hover:opacity-80 transition-colors"
        >
          {category}
        </Link>
      )}

      <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-3">{summary}</p>

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
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
    </article>
  );
}
