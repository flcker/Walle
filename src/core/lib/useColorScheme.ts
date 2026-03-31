"use client";
import { useState, useEffect } from "react";
import { siteConfig } from "@/src/core/config";

type ColorScheme = 'aurora' | 'sunset' | 'ocean' | 'rose';

const DEFAULT_SCHEME = (siteConfig as { themeOptions?: { colorScheme?: ColorScheme } })
  .themeOptions?.colorScheme ?? 'aurora';

export function useColorScheme() {
  const [scheme, setSchemeState] = useState<ColorScheme>(DEFAULT_SCHEME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('color-scheme') as ColorScheme | null;
    const valid: ColorScheme[] = ['aurora', 'sunset', 'ocean', 'rose'];
    const resolved = stored && valid.includes(stored) ? stored : DEFAULT_SCHEME;
    setSchemeState(resolved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-color-scheme', scheme);
    localStorage.setItem('color-scheme', scheme);
  }, [scheme, mounted]);

  const setScheme = (s: ColorScheme) => setSchemeState(s);

  return { scheme, setScheme, mounted };
}
