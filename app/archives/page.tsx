import { getAllPosts, getGroupedArchives } from "@/src/core/lib/posts";
import { ThemedArchiveList, ThemedCalendar } from "@/src/core/ThemeResolver";

export const metadata = { title: "归档" };

export default async function ArchivesPage() {
  const [archives, posts] = await Promise.all([
    getGroupedArchives(),
    getAllPosts(),
  ]);

  const now = new Date();
  const activeDates = posts.map((p) => p.date.slice(0, 10));

  return (
    <div className="flex flex-col gap-10 sm:flex-row-reverse sm:items-start sm:gap-8">
      {/* 日历：右侧（桌面）/ 顶部（移动） */}
      <aside className="sm:w-48 shrink-0">
        <ThemedCalendar
          year={now.getFullYear()}
          month={now.getMonth() + 1}
          activeDates={activeDates}
        />
      </aside>

      {/* 归档列表 */}
      <section className="flex-1">
        <h1 className="mb-6 text-2xl font-bold text-text">归档</h1>
        <ThemedArchiveList archives={archives} />
      </section>
    </div>
  );
}
