"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { siteConfig } from "@/src/core/config";
import { useTheme } from "@/src/core/lib/useTheme";
import { useColorScheme } from "@/src/core/lib/useColorScheme";

const SearchModal = dynamic(() => import("@/src/themes/base/SearchModal"), { ssr: false });

type ColorScheme = 'aurora' | 'sunset' | 'ocean' | 'rose';

const SCHEME_COLORS: Record<ColorScheme, string> = {
  aurora: '#4f46e5',
  sunset: '#ea580c',
  ocean:  '#0891b2',
  rose:   '#e11d48',
};

const SCHEME_LABELS: Record<ColorScheme, string> = {
  aurora: '靛蓝极光',
  sunset: '日落珊瑚',
  ocean:  '深海蓝绿',
  rose:   '玫瑰粉',
};

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

function PaletteIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a9 9 0 1 0 9 9c0-1.66-1.34-3-3-3h-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2z" />
      <circle cx="9"  cy="9"  r="1.5" fill="currentColor" stroke="none" />
      <circle cx="13" cy="7"  r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="9"  cy="14" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

const schemes = (siteConfig as { themeOptions?: { colorSchemes?: readonly ColorScheme[] } })
  .themeOptions?.colorSchemes;

export default function NavbarClient() {
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { theme, toggle, mounted } = useTheme();
  const { scheme, setScheme } = useColorScheme();

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

        {schemes && mounted && (
          <div
            className="relative flex items-center"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) {
                setPaletteOpen(false);
              }
            }}
          >
            <button
              aria-label="切换配色方案"
              onClick={() => setPaletteOpen(v => !v)}
              className="hover:text-primary transition-colors"
            >
              <PaletteIcon />
            </button>

            {paletteOpen && (
              <div className="absolute right-0 top-7 z-50 lgl-glass-card rounded-xl p-3 min-w-[140px] shadow-lg">
                {schemes.map(s => (
                  <button
                    key={s}
                    onClick={() => { setScheme(s); setPaletteOpen(false); }}
                    className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm transition-colors hover:bg-surface ${
                      scheme === s ? 'text-primary font-medium' : 'text-foreground'
                    }`}
                  >
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ background: SCHEME_COLORS[s] }}
                    />
                    {SCHEME_LABELS[s]}
                  </button>
                ))}
              </div>
            )}
          </div>
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
