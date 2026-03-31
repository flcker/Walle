import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/src/core/config";
import NavbarClient from "./NavbarClient";

const { profile } = siteConfig;

const NavLinks = () => (
  <div className="flex items-center gap-5 text-sm text-muted">
    <Link href="/" className="hover:text-primary transition-colors">首页</Link>
    <Link href="/archives" className="hover:text-primary transition-colors">归档</Link>
    <Link href="/categories" className="hover:text-primary transition-colors">分类</Link>
    <Link href="/tags" className="hover:text-primary transition-colors">标签</Link>
    <NavbarClient />
  </div>
);

const SocialLinks = ({ className = "" }: { className?: string }) => {
  const { github, weibo, rss } = profile;
  if (!github && !weibo && !rss) return null;
  return (
    <div className={`flex items-center gap-3 text-sm text-muted ${className}`}>
      {github && (
        <a href={github} target="_blank" rel="noopener noreferrer"
           className="hover:text-primary transition-colors">GitHub</a>
      )}
      {weibo && (
        <a href={weibo} target="_blank" rel="noopener noreferrer"
           className="hover:text-primary transition-colors">微博</a>
      )}
      {rss && (
        <a href="/feed.xml" target="_blank" rel="noopener noreferrer"
           className="hover:text-primary transition-colors">RSS</a>
      )}
    </div>
  );
};

// header-inline：头像+名字+简介在左，导航+社交在右，整体 sticky
function NavbarInline() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80">
          {profile.avatar && (
            <Image src={profile.avatar} alt={profile.name} width={36} height={36}
                   className="rounded-full object-cover shrink-0" />
          )}
          <div>
            <div className="text-base font-bold text-primary leading-tight">{profile.name}</div>
            {profile.bio && (
              <div className="text-xs text-muted leading-tight">{profile.bio}</div>
            )}
          </div>
        </Link>
        <div className="flex items-center gap-5">
          <SocialLinks />
          <NavLinks />
        </div>
      </nav>
    </header>
  );
}

// header-banner：顶部横幅展示完整个人信息（非 sticky），下方 sticky 导航栏
function NavbarBanner() {
  return (
    <>
      <div className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-center gap-5 px-4 py-5">
          {profile.avatar && (
            <Image src={profile.avatar} alt={profile.name} width={64} height={64}
                   className="rounded-full object-cover shrink-0" />
          )}
          <div>
            <div className="text-xl font-bold text-foreground">{profile.name}</div>
            {profile.bio && (
              <div className="text-sm text-muted mt-1">{profile.bio}</div>
            )}
            <SocialLinks className="mt-2" />
          </div>
        </div>
      </div>
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-base font-bold text-primary hover:opacity-80">
            {siteConfig.title}
          </Link>
          <NavLinks />
        </nav>
      </header>
    </>
  );
}

// 默认：原始导航栏
function NavbarDefault() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-primary hover:opacity-80">
          {siteConfig.title}
        </Link>
        <NavLinks />
      </nav>
    </header>
  );
}

export default function Navbar() {
  if (profile.show === 'header-inline') return <NavbarInline />;
  if (profile.show === 'header-banner') return <NavbarBanner />;
  return <NavbarDefault />;
}
