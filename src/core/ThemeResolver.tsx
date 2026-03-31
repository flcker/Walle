import dynamic from "next/dynamic";
import { siteConfig } from "./config";
import type {
  PostCardProps,
  ArchiveListProps,
  CalendarProps,
  PaginationProps,
  TagListProps,
  CategoryListProps,
  FooterProps,
  ProfileProps,
} from "./types";

const theme = siteConfig.theme;

/**
 * 运行时主题组件加载器。
 * 优先加载 src/themes/[theme]/[name]，失败时自动 Fallback 到 base 主题。
 */

export const ThemedNavbar = dynamic(
  () =>
    import(`../themes/${theme}/Navbar`).catch(() =>
      import("../themes/base/Navbar")
    )
);

export const ThemedPostCard = dynamic<PostCardProps>(
  () =>
    import(`../themes/${theme}/PostCard`).catch(() =>
      import("../themes/base/PostCard")
    )
);

export const ThemedArchiveList = dynamic<ArchiveListProps>(
  () =>
    import(`../themes/${theme}/ArchiveList`).catch(() =>
      import("../themes/base/ArchiveList")
    )
);

export const ThemedCalendar = dynamic<CalendarProps>(
  () =>
    import(`../themes/${theme}/Calendar`).catch(() =>
      import("../themes/base/Calendar")
    )
);

export const ThemedPagination = dynamic<PaginationProps>(
  () =>
    import(`../themes/${theme}/Pagination`).catch(() =>
      import("../themes/base/Pagination")
    )
);

export const ThemedTagList = dynamic<TagListProps>(
  () =>
    import(`../themes/${theme}/TagList`).catch(() =>
      import("../themes/base/TagList")
    )
);

export const ThemedCategoryList = dynamic<CategoryListProps>(
  () =>
    import(`../themes/${theme}/CategoryList`).catch(() =>
      import("../themes/base/CategoryList")
    )
);

export const ThemedFooter = dynamic<FooterProps>(
  () =>
    import(`../themes/${theme}/Footer`).catch(() =>
      import("../themes/base/Footer")
    )
);

export const ThemedProfile = dynamic<ProfileProps>(
  () =>
    import(`../themes/${theme}/Profile`).catch(() =>
      import("../themes/base/Profile")
    )
);
