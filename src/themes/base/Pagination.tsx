import Link from "next/link";

interface Props {
  current: number;
  total: number;
  basePath: string; // e.g. "/posts/page"
}

export default function Pagination({ current, total, basePath }: Props) {
  if (total <= 1) return null;

  const prevHref = current > 1
    ? current === 2 ? "/" : `${basePath}/${current - 1}`
    : null;
  const nextHref = current < total ? `${basePath}/${current + 1}` : null;

  return (
    <nav className="mt-8 flex items-center justify-between text-sm">
      {prevHref ? (
        <Link href={prevHref} className="text-primary hover:opacity-80 transition-opacity">
          ← 较新
        </Link>
      ) : (
        <span />
      )}

      <span className="text-muted">
        {current} / {total}
      </span>

      {nextHref ? (
        <Link href={nextHref} className="text-primary hover:opacity-80 transition-opacity">
          较旧 →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
