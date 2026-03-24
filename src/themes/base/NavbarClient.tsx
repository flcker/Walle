"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { siteConfig } from "@/src/core/config";

// 搜索弹窗仅在客户端渲染，首次打开时才加载
const SearchModal = dynamic(() => import("./SearchModal"), { ssr: false });

export default function NavbarClient() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-5 text-sm text-muted">
        {siteConfig.features.search && (
          <button
            aria-label="搜索"
            onClick={() => setOpen(true)}
            className="hover:text-primary transition-colors"
          >
            <svg
              className="h-4 w-4"
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
          </button>
        )}
      </div>

      {open && <SearchModal onClose={() => setOpen(false)} />}
    </>
  );
}
