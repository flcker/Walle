import type { Metadata } from "next";
import "./globals.css";
import "highlight.js/styles/github.css";
import { siteConfig } from "@/src/core/config";
import { ThemedNavbar } from "@/src/core/ThemeResolver";

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
      <body className="min-h-screen bg-background text-text antialiased">
        <ThemedNavbar />
        <main className="mx-auto max-w-3xl px-4 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
