import Link from "next/link";
import type { TagListProps } from "@/src/core/types";

export default function TagList({ tags }: TagListProps) {
  if (tags.length === 0) {
    return <p className="text-sm text-muted">暂无标签。</p>;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {tags.map(({ name, count }) => (
        <Link
          key={name}
          href={`/tags/${encodeURIComponent(name)}`}
          className="rounded-full border border-border bg-surface px-3 py-1 text-sm text-muted hover:text-primary transition-colors"
        >
          {name}
          <span className="ml-1.5 text-xs opacity-60">{count}</span>
        </Link>
      ))}
    </div>
  );
}
