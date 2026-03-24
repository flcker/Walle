export const siteConfig = {
  title: 'Walle',
  description: '一个简洁的静态博客',
  author: 'Your Name',
  theme: 'base',
  postsPerPage: 10,
  features: {
    search: true,
    calendar: true,
  },
} as const;

export type SiteConfig = typeof siteConfig;
