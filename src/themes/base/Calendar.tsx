import { siteConfig } from "@/src/core/config";

interface Props {
  year: number;
  month: number;       // 1-12
  activeDates: string[]; // ISO 日期字符串数组
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

export default function Calendar({ year, month, activeDates }: Props) {
  if (!siteConfig.features.calendar) return null;

  // 当月第一天是星期几（0=日）
  const firstDay = new Date(year, month - 1, 1).getDay();
  // 当月天数
  const daysInMonth = new Date(year, month, 0).getDate();

  // 将 activeDates 规范化为 "YYYY-MM-DD" 集合，方便查找
  const activeSet = new Set(
    activeDates.map((d) => d.slice(0, 10))
  );

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const dateKey = (day: number) =>
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="mb-3 text-center text-sm font-semibold text-text">
        {year} 年 {month} 月
      </p>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => (
          <span key={d} className="text-xs text-muted py-1">
            {d}
          </span>
        ))}

        {cells.map((day, idx) =>
          day === null ? (
            <span key={`empty-${idx}`} />
          ) : (
            <span
              key={day}
              className={[
                "flex h-7 w-7 mx-auto items-center justify-center rounded-full text-xs",
                activeSet.has(dateKey(day))
                  ? "bg-primary text-white font-semibold"
                  : "text-text",
              ].join(" ")}
            >
              {day}
            </span>
          )
        )}
      </div>
    </div>
  );
}
