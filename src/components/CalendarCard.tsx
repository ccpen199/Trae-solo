import { useEffect, useState } from "react";
import { Leaf } from "lucide-react";
import type { CalendarData } from "@/types";
import { getCalendarData } from "@/utils/calendar";
import VoiceButton from "./VoiceButton";

export default function CalendarCard() {
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);

  useEffect(() => {
    setCalendarData(getCalendarData());
  }, []);

  if (!calendarData) return null;

  const { lunar, solarDate, weekDay, yi, ji, currentSolarTerm } = calendarData;

  const summaryText = `今天是${solarDate}，${weekDay}，农历${lunar.lunarMonthName}${lunar.lunarDayName}，${lunar.yearGanZhi}年，生肖${lunar.yearAnimal}。宜${yi.map((i) => i.name).join("、")}。忌${ji.map((i) => i.name).join("、")}。${currentSolarTerm ? `当前节气${currentSolarTerm.name}，${currentSolarTerm.healthTips[0]}。` : ""}`;

  return (
    <div className="a11y-card animate-slide-up">
      <div className="mb-4">
        <h2 className="text-a11y-xl font-bold a11y-text mb-1">
          {solarDate}
        </h2>
        <p className="a11y-text-secondary text-a11y-lg">{weekDay}</p>
      </div>

      <div
        className="p-4 rounded-a11y mb-4"
        style={{ backgroundColor: "rgba(44, 122, 123, 0.08)" }}
      >
        <p className="text-a11y-lg a11y-text">
          农历 <span className="font-bold">{lunar.lunarMonthName}{lunar.lunarDayName}</span>
        </p>
        <p className="a11y-text-secondary text-a11y-sm">
          {lunar.yearGanZhi}年 · 生肖{lunar.yearAnimal}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="p-4 rounded-a11y" style={{ backgroundColor: "rgba(56, 161, 105, 0.1)" }}>
          <h3 className="text-a11y-lg font-bold text-green-700 mb-2">
            宜
          </h3>
          <div className="flex flex-wrap gap-2">
            {yi.map((item) => (
              <span
                key={item.name}
                className="a11y-tag bg-green-100 text-green-700"
                title={item.description}
              >
                {item.name}
              </span>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-a11y" style={{ backgroundColor: "rgba(229, 62, 62, 0.1)" }}>
          <h3 className="text-a11y-lg font-bold text-red-700 mb-2">
            忌
          </h3>
          <div className="flex flex-wrap gap-2">
            {ji.map((item) => (
              <span
                key={item.name}
                className="a11y-tag bg-red-100 text-red-700"
                title={item.description}
              >
                {item.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {currentSolarTerm && (
        <div
          className="p-4 rounded-a11y mb-4"
          style={{ backgroundColor: "rgba(255, 122, 69, 0.08)" }}
        >
          <h3 className="text-a11y-lg font-bold a11y-text mb-2 flex items-center gap-2">
            <Leaf className="w-6 h-6 text-green-600" />
            节气养生：{currentSolarTerm.name}
          </h3>
          <ul className="space-y-1 a11y-text-secondary">
            {currentSolarTerm.healthTips.slice(0, 3).map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-primary-500">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end">
        <VoiceButton text={summaryText} label="播报黄历" />
      </div>
    </div>
  );
}
