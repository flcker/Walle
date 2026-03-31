import Image from "next/image";
import { siteConfig } from "@/src/core/config";

export default function Profile() {
  const { name, bio, avatar, github, weibo, rss } = siteConfig.profile;
  const hasSocial = github || weibo || rss;

  return (
    <div className="flex items-center gap-5 rounded-lg border border-border bg-surface p-5 mb-8">
      {avatar && (
        <Image
          src={avatar}
          alt={name}
          width={64}
          height={64}
          className="rounded-full object-cover shrink-0"
        />
      )}
      <div>
        <p className="text-lg font-semibold text-foreground">{name}</p>
        {bio && <p className="text-sm text-muted mt-1">{bio}</p>}
        {hasSocial && (
          <div className="flex items-center gap-4 mt-3 text-sm text-muted">
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
        )}
      </div>
    </div>
  );
}
