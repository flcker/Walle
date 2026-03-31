import type { Metadata } from "next";
import "./globals.css";
import "highlight.js/styles/github.css";
import { siteConfig } from "@/src/core/config";
import { ThemedNavbar, ThemedFooter } from "@/src/core/ThemeResolver";
import { ThemeGlobalStyles } from "@/src/core/ThemeGlobalStyles";

// 阻塞式内联脚本：在 React 水合前设置正确主题，避免 FOUC
const themeScript = `(function(){var s=localStorage.getItem('theme');var t=s==='light'||s==='dark'?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);})();`;

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeGlobalStyles />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-text antialiased">
        <ThemedNavbar />
        <main className="mx-auto max-w-3xl px-4 py-10 flex-1 w-full">
          {children}
        </main>
        <ThemedFooter />
      </body>
    </html>
  );
}
