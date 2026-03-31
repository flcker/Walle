import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        surface:    "var(--color-surface)",
        border:     "var(--color-border)",
        primary:    "var(--color-primary)",
        secondary:  "var(--color-secondary)",
        text:       "var(--color-text)",
        muted:      "var(--color-text-muted)",
      },
      typography: {
        DEFAULT: {
          css: {
            "--tw-prose-body":        "var(--color-text)",
            "--tw-prose-headings":    "var(--color-text)",
            "--tw-prose-links":       "var(--color-primary)",
            "--tw-prose-bold":        "var(--color-text)",
            "--tw-prose-code":        "var(--color-text)",
            "--tw-prose-quotes":      "var(--color-text-muted)",
            "--tw-prose-quote-borders": "var(--color-border)",
            "--tw-prose-captions":    "var(--color-text-muted)",
            "--tw-prose-hr":          "var(--color-border)",
            "--tw-prose-th-borders":  "var(--color-border)",
            "--tw-prose-td-borders":  "var(--color-border)",
            // 代码块背景
            "code::before": { content: '""' },
            "code::after":  { content: '""' },
            code: {
              backgroundColor: "var(--color-surface)",
              padding: "0.2em 0.4em",
              borderRadius: "0.25rem",
              fontSize: "0.875em",
            },
          },
        },
      },
    },
  },
  plugins: [typography],
};

export default config;
