import Link from "next/link";
import type { CategoryListProps } from "@/src/core/types";

export default function CategoryList({ categories }: CategoryListProps) {
  if (categories.length === 0) {
    return <p className="text-sm text-muted">暂无分类。</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {categories.map(({ name, count }) => (
        <li key={name}>
          <Link
            href={`/categories/${encodeURIComponent(name)}`}
            className="flex items-center justify-between py-3 text-sm text-foreground hover:text-primary transition-colors"
          >
            <span>{name}</span>
            <span className="text-xs text-muted">{count} 篇</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
