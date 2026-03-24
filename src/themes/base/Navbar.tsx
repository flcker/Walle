import Link from "next/link";
import { siteConfig } from "@/src/core/config";
import NavbarClient from "./NavbarClient";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-primary hover:opacity-80">
          {siteConfig.title}
        </Link>

        <div className="flex items-center gap-5 text-sm text-muted">
          <Link href="/" className="hover:text-primary transition-colors">
            首页
          </Link>
          <Link href="/archives" className="hover:text-primary transition-colors">
            归档
          </Link>
          <Link href="/categories" className="hover:text-primary transition-colors">
            分类
          </Link>
          <Link href="/tags" className="hover:text-primary transition-colors">
            标签
          </Link>
          <NavbarClient />
        </div>
      </nav>
    </header>
  );
}
