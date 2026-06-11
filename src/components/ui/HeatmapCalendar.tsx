import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface DayData {
  date: Date;
  value: number;
  label?: string;
}

interface HeatmapCalendarProps {
  data?: DayData[];
  month?: Date;
  showLegend?: boolean;
  className?: string;
}

const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({
  data,
  month = new Date(),
  showLegend = true,
  className,
}) => {
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);

  const generateMonthDays = (): DayData[] => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const startPadding = firstDay.getDay();
    const days: DayData[] = [];

    for (let i = 0; i < startPadding; i++) {
      const date = new Date(year, monthIndex, -startPadding + i + 1);
      days.push({ date, value: -1 });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, monthIndex, i);
      const existing = data?.find(
        (d) => d.date.toDateString() === date.toDateString()
      );
      if (existing) {
        days.push(existing);
      } else {
        days.push({ date, value: Math.random() * 100 });
      }
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, monthIndex + 1, i);
      days.push({ date, value: -1 });
    }

    return days;
  };

  const days = generateMonthDays();

  const getColor = (value: number) => {
    if (value < 0) return "bg-deep-sea-700/30";
    if (value < 20) return "bg-vital-green-500/10";
    if (value < 40) return "bg-vital-green-500/25";
    if (value < 60) return "bg-vital-green-500/45";
    if (value < 80) return "bg-vital-green-500/65";
    return "bg-vital-green-500/85";
  };

  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  const monthName = month.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
  });

  const isCurrentMonth = (day: DayData) =>
    day.date.getMonth() === month.getMonth();

  return (
    <div className={cn("p-5 rounded-2xl", "bg-deep-sea-600/50", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg">{monthName}</h3>
        {hoveredDay && hoveredDay.value >= 0 && (
          <div className="text-sm animate-pulse">
            <span className="text-deep-sea-100/60">
              {hoveredDay.date.toLocaleDateString("zh-CN", {
                month: "long",
                day: "numeric",
              })}
              :{" "}
            </span>
            <span className="text-vital-green-500 font-bold">
              {Math.round(hoveredDay.value)}%
            </span>
            {hoveredDay.label && (
              <span className="text-deep-sea-100/50"> {hoveredDay.label}</span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {weekdays.map((day) => (
          <div
            key={day}
            className="text-center text-deep-sea-100/50 text-xs font-medium py-1"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, index) => (
          <div
            key={index}
            className={cn(
              "aspect-square rounded-md flex items-center justify-center",
              "text-xs font-medium transition-all duration-200",
              getColor(day.value),
              isCurrentMonth(day) ? "text-white" : "text-deep-sea-100/30",
              day.value >= 0 &&
                isCurrentMonth(day) &&
                "hover:scale-110 hover:z-10 cursor-pointer",
              day.value >= 0 &&
                day.value > 60 &&
                "shadow-md shadow-vital-green-500/20"
            )}
            onMouseEnter={() => setHoveredDay(day)}
            onMouseLeave={() => setHoveredDay(null)}
          >
            {day.date.getDate()}
          </div>
        ))}
      </div>

      {showLegend && (
        <div className="flex items-center justify-end gap-2 mt-4">
          <span className="text-deep-sea-100/50 text-xs">少</span>
          {[0.1, 0.25, 0.45, 0.65, 0.85].map((opacity, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: `rgba(0, 229, 160, ${opacity})` }}
            />
          ))}
          <span className="text-deep-sea-100/50 text-xs">多</span>
        </div>
      )}
    </div>
  );
};

export default HeatmapCalendar;
