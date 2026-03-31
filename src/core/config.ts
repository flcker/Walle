const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** 将 /assets/... 路径转换为带 basePath 前缀的完整 URL */
export function assetUrl(path: string): string {
  return `${basePath}${path}`;
}

export const siteConfig = {
  title: 'Walle Blog',
  description: '一个简洁的静态博客',
  author: 'Your Name',
  theme: 'base',
  postsPerPage: 10,
  features: {
    search: true,
    calendar: true,
  },
  footer: {
    copyright: 'Your Name',
  },
  profile: {
    show: 'header-banner' as 'home-top' | 'home-bottom' | 'header-inline' | 'header-banner' | false,
    // 'home-top'      = 首页文章列表上方（独立卡片）
    // 'home-bottom'   = 首页文章列表下方（独立卡片）
    // 'header-inline' = 与导航栏合并：头像+名字在左，导航链接在右（sticky）
    // 'header-banner' = 导航栏上方展示横幅（非 sticky），导航栏保持 sticky
    name: 'Your Name',
    bio: 'Walle 是一个简洁的静态博客',        // 一句话简介，留空不显示
    avatar: '/assets/avatar.svg',     // 头像路径（public/assets/ 下的 URL），留空不显示
    github: 'https://github.com/flcker',     // GitHub 主页 URL，留空不显示
    weibo: 'https://weibo.com/yourusername',      // 微博主页 URL，留空不显示
    rss: false,     // 是否显示 RSS 链接 /feed.xml
  },
} as const;

export type SiteConfig = typeof siteConfig;
