import { useMemo } from "react";
import {
  ArrowLeft,
  Leaf,
  Apple,
  Heart,
  CalendarDays,
  Cake,
  PartyPopper,
  Star,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDataStore } from "@/store/dataStore";
import VoiceButton from "@/components/VoiceButton";
import LargeButton from "@/components/LargeButton";

const getMemorialDayIcon = (type: string) => {
  switch (type) {
    case "birthday":
      return <Cake className="w-7 h-7 text-red-500" />;
    case "festival":
      return <PartyPopper className="w-7 h-7 text-orange-500" />;
    case "anniversary":
      return <Heart className="w-7 h-7 text-pink-500" />;
    default:
      return <Star className="w-7 h-7 text-blue-500" />;
  }
};

const getDaysUntilColor = (type: string) => {
  switch (type) {
    case "birthday":
      return "var(--color-danger)";
    case "festival":
      return "var(--color-primary)";
    case "anniversary":
      return "#ec4899";
    default:
      return "var(--color-secondary)";
  }
};

export default function Calendar() {
  const navigate = useNavigate();
  const calendarData = useDataStore((state) => state.calendarData);

  const summaryText = useMemo(() => {
    if (!calendarData) return "";
    const { lunar, solarDate, weekDay, yi, ji, currentSolarTerm } = calendarData;
    const yiNames = yi.map((i) => i.name).join("、");
    const jiNames = ji.map((i) => i.name).join("、");
    const solarTermText = currentSolarTerm
      ? `当前节气${currentSolarTerm.name}，${currentSolarTerm.healthTips[0]}。饮食建议${currentSolarTerm.dietTips[0]}。`
      : "";
    return `今天是${solarDate}，${weekDay}，农历${lunar.lunarMonthName}${lunar.lunarDayName}，${lunar.yearGanZhi}年，生肖${lunar.yearAnimal}。宜${yiNames}。忌${jiNames}。${solarTermText}`;
  }, [calendarData]);

  if (!calendarData) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: "var(--color-bg)" }}
      >
        <div
          className="flex items-center justify-between px-4 py-4"
          style={{
            backgroundColor: "var(--color-card-bg)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <button
            onClick={() => navigate(-1)}
            className="a11y-btn a11y-btn-ghost"
            aria-label="返回"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>
          <h1 className="text-a11y-xl font-bold a11y-text">农历黄历</h1>
          <div className="w-24" />
        </div>
        <div className="p-6">
          <div className="a11y-card text-center py-10">
            <p className="text-a11y-xl a11y-text-secondary">暂无黄历数据</p>
          </div>
        </div>
      </div>
    );
  }

  const { lunar, solarDate, weekDay, yi, ji, currentSolarTerm, memorialDays } =
    calendarData;

  const sortedMemorialDays = [...memorialDays].sort(
    (a, b) => (a.daysUntil || 0) - (b.daysUntil || 0)
  );

  return (
    <div
      className="min-h-screen pb-8 animate-fade-in"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-4"
        style={{
          backgroundColor: "var(--color-card-bg)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="a11y-btn a11y-btn-ghost"
          aria-label="返回"
        >
          <ArrowLeft className="w-7 h-7" />
        </button>
        <h1 className="text-a11y-xl font-bold a11y-text">农历黄历</h1>
        <VoiceButton text={summaryText} label="播报" />
      </div>

      <div className="px-4 py-6 space-y-6">
        <div
          className="a11y-card text-center animate-slide-up"
          style={{
            background:
              "linear-gradient(135deg, rgba(44, 122, 123, 0.15), rgba(255, 122, 69, 0.1))",
          }}
        >
          <p
            className="font-bold a11y-text mb-2 leading-tight"
            style={{ fontSize: "calc(var(--font-size-current) + 40px)" }}
          >
            {solarDate.replace(/年\d+月/, "").replace("日", "")}
          </p>
          <p className="text-a11y-xl a11y-text-secondary mb-5">{weekDay}</p>
          <div className="a11y-divider mb-5" />
          <div className="space-y-2">
            <p className="text-a11y-xl font-bold a11y-text">
              农历 {lunar.lunarMonthName}
              {lunar.lunarDayName}
            </p>
            <p className="text-a11y-lg a11y-text-secondary">
              {lunar.yearGanZhi}年 · 生肖{lunar.yearAnimal}
            </p>
          </div>
        </div>

        <div className="animate-slide-up">
          <h3 className="text-a11y-xl font-bold a11y-text mb-4">今日宜忌</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div
              className="a11y-card"
              style={{ backgroundColor: "rgba(56, 161, 105, 0.06)" }}
            >
              <h3
                className="text-a11y-xl font-bold mb-4 flex items-center gap-2"
                style={{ color: "var(--color-success)" }}
              >
                ✓ 宜
              </h3>
              <div className="space-y-3">
                {yi.map((item) => (
                  <div
                    key={item.name}
                    className="p-3 rounded-a11y"
                    style={{ backgroundColor: "rgba(56, 161, 105, 0.1)" }}
                  >
                    <p className="text-a11y-lg font-bold text-green-700 mb-1">
                      {item.name}
                    </p>
                    <p className="text-a11y text-green-600">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="a11y-card"
              style={{ backgroundColor: "rgba(229, 62, 62, 0.06)" }}
            >
              <h3
                className="text-a11y-xl font-bold mb-4 flex items-center gap-2"
                style={{ color: "var(--color-danger)" }}
              >
                ✗ 忌
              </h3>
              <div className="space-y-3">
                {ji.map((item) => (
                  <div
                    key={item.name}
                    className="p-3 rounded-a11y"
                    style={{ backgroundColor: "rgba(229, 62, 62, 0.1)" }}
                  >
                    <p className="text-a11y-lg font-bold text-red-700 mb-1">
                      {item.name}
                    </p>
                    <p className="text-a11y text-red-600">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {currentSolarTerm && (
          <div className="a11y-card animate-slide-up">
            <h3 className="text-a11y-xl font-bold a11y-text mb-5 flex items-center gap-2">
              <Leaf className="w-8 h-8 text-green-600" />
              节气养生 · {currentSolarTerm.name}
            </h3>

            <div className="space-y-5">
              <div
                className="p-4 rounded-a11y"
                style={{ backgroundColor: "rgba(56, 161, 105, 0.08)" }}
              >
                <h4 className="text-a11y-lg font-bold text-green-700 mb-3 flex items-center gap-2">
                  <Leaf className="w-6 h-6" />
                  养生建议
                </h4>
                <ol className="space-y-2 pl-2">
                  {currentSolarTerm.healthTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-a11y-sm"
                        style={{
                          backgroundColor: "var(--color-success)",
                          color: "white",
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-a11y a11y-text pt-1">{tip}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div
                className="p-4 rounded-a11y"
                style={{ backgroundColor: "rgba(255, 122, 69, 0.08)" }}
              >
                <h4 className="text-a11y-lg font-bold text-primary-600 mb-3 flex items-center gap-2">
                  <Apple className="w-6 h-6" />
                  饮食建议
                </h4>
                <ol className="space-y-2 pl-2">
                  {currentSolarTerm.dietTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-a11y-sm"
                        style={{
                          backgroundColor: "var(--color-primary)",
                          color: "white",
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-a11y a11y-text pt-1">{tip}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div
                className="p-4 rounded-a11y"
                style={{ backgroundColor: "rgba(44, 122, 123, 0.08)" }}
              >
                <h4 className="text-a11y-lg font-bold text-secondary-600 mb-3 flex items-center gap-2">
                  <Heart className="w-6 h-6" />
                  穴位按摩
                </h4>
                <ol className="space-y-2 pl-2">
                  {currentSolarTerm.acupressureTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-a11y-sm"
                        style={{
                          backgroundColor: "var(--color-secondary)",
                          color: "white",
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-a11y a11y-text pt-1">{tip}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}

        <div className="animate-slide-up">
          <h3 className="text-a11y-xl font-bold a11y-text mb-4 flex items-center gap-2">
            <CalendarDays className="w-8 h-8 text-primary-500" />
            近期纪念日
          </h3>
          <div className="a11y-card divide-y" style={{ borderColor: "var(--color-border)" }}>
            {sortedMemorialDays.map((day) => (
              <div
                key={day.id}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                style={{ borderColor: "var(--color-border)" }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="p-3 rounded-a11y flex-shrink-0"
                    style={{
                      backgroundColor:
                        day.type === "birthday"
                          ? "rgba(229, 62, 62, 0.1)"
                          : day.type === "festival"
                          ? "rgba(255, 122, 69, 0.1)"
                          : day.type === "anniversary"
                          ? "rgba(236, 72, 153, 0.1)"
                          : "rgba(44, 122, 123, 0.1)",
                    }}
                  >
                    {getMemorialDayIcon(day.type)}
                  </div>
                  <div>
                    <p className="text-a11y-lg font-bold a11y-text">
                      {day.name}
                    </p>
                    <p className="text-a11y a11y-text-secondary">
                      {day.date}
                      {day.isLunar && "（农历）"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className="text-a11y-2xl font-bold"
                    style={{ color: getDaysUntilColor(day.type) }}
                  >
                    {day.daysUntil === 0 ? "今天" : `${day.daysUntil}天`}
                  </p>
                  <p className="text-a11y-sm a11y-text-secondary">
                    {day.daysUntil === 0 ? "就是今天" : "后到来"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <LargeButton
            size="xlarge"
            fullWidth
            icon={<Plus className="w-7 h-7" />}
            onClick={() => {}}
          >
            添加纪念日
          </LargeButton>
        </div>
      </div>
    </div>
  );
}
