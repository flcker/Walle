export interface Post {
  slug: string;
  title: string;
  date: string;       // ISO 8601 格式
  summary: string;
  tags: string[];
  category: string;
  content: string;    // 渲染后的 HTML
  rawContent: string; // 原始 Markdown
}

export interface GroupedArchive {
  year: number;
  posts: Pick<Post, 'slug' | 'title' | 'date'>[];
}

export interface SearchIndexItem {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  category: string;
  date: string;
}

// ─── 主题组件 Props ──────────────────────────────────────

export type PostCardProps = Pick<Post, 'slug' | 'title' | 'date' | 'summary' | 'tags' | 'category'>;

export interface ArchiveListProps {
  archives: GroupedArchive[];
}

export interface CalendarProps {
  year: number;
  month: number;
  activeDates: string[];
}

export interface PaginationProps {
  current: number;
  total: number;
  basePath: string;
}

export interface TagListProps {
  tags: { name: string; count: number }[];
}

export interface CategoryListProps {
  categories: { name: string; count: number }[];
}
