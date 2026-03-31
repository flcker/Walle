"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { siteConfig } from "@/src/core/config";
import { useTheme } from "@/src/core/lib/useTheme";

// 搜索弹窗仅在客户端渲染，首次打开时才加载
const SearchModal = dynamic(() => import("./SearchModal"), { ssr: false });

function SunIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="5" />
      <path strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function NavbarClient() {
  const [open, setOpen] = useState(false);
  const { theme, toggle, mounted } = useTheme();

  return (
    <>
      <div className="flex items-center gap-5 text-sm text-muted">
        {siteConfig.features.themeToggle && mounted && (
          <button
            aria-label={theme === 'dark' ? '切换到亮色' : '切换到暗色'}
            onClick={toggle}
            className="hover:text-primary transition-colors"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        )}
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
