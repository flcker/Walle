import type { Config } from "tailwindcss";

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
    },
  },
  plugins: [],
};

export default config;
