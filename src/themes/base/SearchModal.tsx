"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import type { SearchIndexItem } from "@/src/core/types";

interface Props {
  onClose: () => void;
}

export default function SearchModal({ onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchIndexItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const fuseRef = useRef<Fuse<SearchIndexItem> | null>(null);

  // 首次打开时懒加载搜索索引
  useEffect(() => {
    if (fuseRef.current) return;
    fetch("/search-index.json")
      .then((r) => r.json())
      .then((data: SearchIndexItem[]) => {
        fuseRef.current = new Fuse(data, {
          keys: [
            { name: "title",   weight: 0.6 },
            { name: "summary", weight: 0.3 },
            { name: "tags",    weight: 0.1 },
          ],
          threshold: 0.4,
          includeScore: true,
        });
      })
      .catch(console.error);
  }, []);

  // 聚焦输入框
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Escape 关闭
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSearch = (value: string) => {
    setQuery(value);
    setActiveIndex(0);
    if (!fuseRef.current || !value.trim()) {
      setResults([]);
      return;
    }
    setResults(fuseRef.current.search(value).slice(0, 8).map((r) => r.item));
  };

  const navigate = useCallback(
    (slug: string) => {
      router.push(`/posts/${slug}`);
      onClose();
    },
    [router, onClose]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      navigate(results[activeIndex].slug);
    }
  };

  return (
    /* 遮罩层 */
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-24 px-4"
      onClick={onClose}
    >
      {/* 弹窗主体 */}
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 输入框 */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <svg
            className="h-4 w-4 shrink-0 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索文章..."
            className="flex-1 bg-transparent text-sm text-text placeholder:text-muted outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center rounded border border-border px-1.5 text-xs text-muted">
            ESC
          </kbd>
        </div>

        {/* 搜索结果 */}
        {results.length > 0 && (
          <ul className="max-h-80 overflow-y-auto py-2">
            {results.map((item, idx) => (
              <li key={item.slug}>
                <button
                  className={[
                    "w-full px-4 py-2.5 text-left transition-colors",
                    idx === activeIndex ? "bg-surface" : "hover:bg-surface",
                  ].join(" ")}
                  onClick={() => navigate(item.slug)}
                  onMouseEnter={() => setActiveIndex(idx)}
                >
                  <p className="text-sm font-medium text-text">{item.title}</p>
                  <p className="mt-0.5 text-xs text-muted line-clamp-1">
                    {item.summary}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* 无结果提示 */}
        {query.trim() && results.length === 0 && (
          <p className="px-4 py-5 text-center text-sm text-muted">
            未找到与「{query}」相关的文章
          </p>
        )}
      </div>
    </div>
  );
}
