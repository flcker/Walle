import Image from "next/image";
import Link from "next/link";
import { siteConfig, assetUrl } from "@/src/core/config";
import NavbarClient from "@/src/themes/base/NavbarClient";

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

function NavbarInline() {
  return (
    <header className="lgl-navbar sticky top-0 z-50">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80">
          {profile.avatar && (
            <Image src={assetUrl(profile.avatar)} alt={profile.name} width={36} height={36}
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

function NavbarBanner() {
  return (
    <>
      <div className="lgl-navbar">
        <div className="mx-auto flex max-w-3xl items-center gap-5 px-4 py-5">
          {profile.avatar && (
            <Image src={assetUrl(profile.avatar)} alt={profile.name} width={64} height={64}
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
      <header className="lgl-navbar sticky top-0 z-50">
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

function NavbarDefault() {
  return (
    <header className="lgl-navbar sticky top-0 z-50">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-primary hover:opacity-80">
          {siteConfig.title}
        </Link>
        <NavLinks />
      </nav>
    </header>
  );
}

// 第三个背景 blob（body::before / body::after 只有 2 个伪元素，第三个用真实 DOM）
const LglBlob3 = () => <div className="lgl-blob-3" aria-hidden="true" />;

export default function Navbar() {
  if (profile.show === 'header-inline') return <><LglBlob3 /><NavbarInline /></>;
  if (profile.show === 'header-banner') return <><LglBlob3 /><NavbarBanner /></>;
  return <><LglBlob3 /><NavbarDefault /></>;
}
