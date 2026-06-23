import { useMemo } from "react";
import {
  ArrowLeft,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Moon,
  Thermometer,
  Shirt,
  Umbrella,
  Wind,
  Droplets,
  Car,
  SunMedium,
  Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDataStore } from "@/store/dataStore";
import VoiceButton from "@/components/VoiceButton";

const getWeatherIconComponent = (
  condition: string,
  size: "sm" | "md" | "lg" | "xl" = "lg"
) => {
  const sizeMap = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  if (condition.includes("雷")) {
    return <CloudLightning className={`${sizeMap[size]} text-purple-500`} />;
  }
  if (condition.includes("雨")) {
    return <CloudRain className={`${sizeMap[size]} text-blue-500`} />;
  }
  if (condition.includes("云") || condition.includes("阴")) {
    return <Cloud className={`${sizeMap[size]} text-gray-500`} />;
  }
  if (condition.includes("月") || condition.includes("夜")) {
    return <Moon className={`${sizeMap[size]} text-indigo-400`} />;
  }
  return <Sun className={`${sizeMap[size]} text-yellow-500`} />;
};

export default function Weather() {
  const navigate = useNavigate();
  const weatherData = useDataStore((state) => state.weatherData);

  const summaryText = useMemo(() => {
    if (!weatherData) return "";
    const { current, daily } = weatherData;
    const weekForecast = daily
      .slice(0, 3)
      .map((d) => `${d.date}${d.dayCondition}，最高${d.highTemp}度最低${d.lowTemp}度`)
      .join("；");
    return `${current.city}今日天气，${current.condition}，温度${current.temperature}度，体感温度${current.feelsLike}度。${current.dressingAdvice}。${current.umbrellaAdvice.need ? current.umbrellaAdvice.reason : "无需带伞。"}紫外线${current.uvIndex.level}，${current.uvIndex.suggestion}。空气质量${current.airQuality.level}。未来三天：${weekForecast}。`;
  }, [weatherData]);

  if (!weatherData) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
        <div className="flex items-center justify-between px-4 py-4" style={{ backgroundColor: "var(--color-card-bg)", borderBottom: "1px solid var(--color-border)" }}>
          <button
            onClick={() => navigate(-1)}
            className="a11y-btn a11y-btn-ghost"
            aria-label="返回"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>
          <h1 className="text-a11y-xl font-bold a11y-text">天气服务</h1>
          <div className="w-24" />
        </div>
        <div className="p-6">
          <div className="a11y-card text-center py-10">
            <p className="text-a11y-xl a11y-text-secondary">暂无天气数据</p>
          </div>
        </div>
      </div>
    );
  }

  const { current, hourly, daily } = weatherData;

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
        <h1 className="text-a11y-xl font-bold a11y-text">天气服务</h1>
        <VoiceButton text={summaryText} label="播报" />
      </div>

      <div className="px-4 py-6 space-y-6">
        <div
          className="a11y-card text-center animate-slide-up"
          style={{
            background: "linear-gradient(135deg, rgba(255, 122, 69, 0.15), rgba(44, 122, 123, 0.1))",
          }}
        >
          <h2 className="text-a11y-2xl font-bold a11y-text mb-3">
            {current.city}
          </h2>
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="animate-pulse-soft">
              {getWeatherIconComponent(current.condition, "xl")}
            </div>
            <div className="text-left">
              <p
                className="font-bold a11y-text leading-none"
                style={{ fontSize: "calc(var(--font-size-current) + 60px)" }}
              >
                {current.temperature}°
              </p>
              <p className="text-a11y-lg a11y-text-secondary mt-2">
                {current.condition}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-a11y-lg a11y-text-secondary">
            <Thermometer className="w-6 h-6 text-orange-500" />
            <span>体感温度 {current.feelsLike}°C</span>
          </div>
        </div>

        <div
          className="a11y-card animate-slide-up"
          style={{
            backgroundColor: current.umbrellaAdvice.need
              ? "rgba(229, 62, 62, 0.12)"
              : "rgba(255, 122, 69, 0.12)",
            borderColor: current.umbrellaAdvice.need
              ? "rgba(229, 62, 62, 0.3)"
              : "rgba(255, 122, 69, 0.3)",
          }}
        >
          <h3
            className="text-a11y-xl font-bold mb-5 flex items-center gap-2"
            style={{
              color: current.umbrellaAdvice.need
                ? "var(--color-danger)"
                : "var(--color-primary)",
            }}
          >
            ⚠️ 今日强提醒
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex items-start gap-4">
              <div
                className="p-4 rounded-a11y flex-shrink-0"
                style={{ backgroundColor: "rgba(255, 122, 69, 0.15)" }}
              >
                <Shirt className="w-10 h-10 text-primary-600" />
              </div>
              <div>
                <p className="text-a11y-lg font-bold a11y-text mb-1">穿衣建议</p>
                <p className="text-a11y a11y-text-secondary">
                  {current.dressingAdvice}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div
                className="p-4 rounded-a11y flex-shrink-0"
                style={{
                  backgroundColor: current.umbrellaAdvice.need
                    ? "rgba(229, 62, 62, 0.15)"
                    : "rgba(56, 161, 105, 0.15)",
                }}
              >
                <Umbrella
                  className={`w-10 h-10 ${
                    current.umbrellaAdvice.need ? "text-red-600" : "text-green-600"
                  }`}
                />
              </div>
              <div>
                <p className="text-a11y-lg font-bold a11y-text mb-1">
                  {current.umbrellaAdvice.need ? "请带伞" : "无需带伞"}
                </p>
                <p className="text-a11y a11y-text-secondary">
                  {current.umbrellaAdvice.reason}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="animate-slide-up">
          <h3 className="text-a11y-xl font-bold a11y-text mb-4">生活指数</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="a11y-card">
              <div className="flex items-center gap-3 mb-2">
                <SunMedium className="w-8 h-8 text-yellow-500" />
                <p className="text-a11y-lg font-bold a11y-text">紫外线</p>
              </div>
              <p className="text-a11y font-bold text-primary-500 mb-1">
                {current.uvIndex.level}（{current.uvIndex.value}）
              </p>
              <p className="text-a11y-sm a11y-text-secondary">
                {current.uvIndex.suggestion}
              </p>
            </div>

            <div className="a11y-card">
              <div className="flex items-center gap-3 mb-2">
                <Car className="w-8 h-8 text-blue-500" />
                <p className="text-a11y-lg font-bold a11y-text">洗车指数</p>
              </div>
              <p className="text-a11y font-bold text-secondary-500 mb-1">
                {current.carWashIndex.level}
              </p>
              <p className="text-a11y-sm a11y-text-secondary">
                {current.carWashIndex.suggestion}
              </p>
            </div>

            <div className="a11y-card">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-8 h-8 text-green-500" />
                <p className="text-a11y-lg font-bold a11y-text">空气质量</p>
              </div>
              <p className="text-a11y font-bold text-green-600 mb-1">
                {current.airQuality.level}（{current.airQuality.aqi}）
              </p>
              <p className="text-a11y-sm a11y-text-secondary">
                {current.airQuality.description}
              </p>
            </div>

            <div className="a11y-card">
              <div className="flex items-center gap-3 mb-2">
                <Droplets className="w-8 h-8 text-cyan-500" />
                <p className="text-a11y-lg font-bold a11y-text">湿度</p>
              </div>
              <p className="text-a11y font-bold text-cyan-600 mb-1">
                {current.humidity}%
              </p>
              <p className="text-a11y-sm a11y-text-secondary">
                空气相对湿度
              </p>
            </div>

            <div className="a11y-card md:col-span-2">
              <div className="flex items-center gap-3 mb-2">
                <Wind className="w-8 h-8 text-teal-500" />
                <p className="text-a11y-lg font-bold a11y-text">风力风向</p>
              </div>
              <p className="text-a11y font-bold text-teal-600 mb-1">
                {current.windDirection} {current.windSpeed}级
              </p>
              <p className="text-a11y-sm a11y-text-secondary">
                注意防风，外出时关好门窗
              </p>
            </div>
          </div>
        </div>

        <div className="animate-slide-up">
          <h3 className="text-a11y-xl font-bold a11y-text mb-4">24小时预报</h3>
          <div
            className="a11y-card overflow-x-auto scrollbar-thin"
            style={{ padding: "1.5rem" }}
          >
            <div className="flex gap-5 min-w-max">
              {hourly.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center gap-2 min-w-[72px] py-2"
                >
                  <p className="text-a11y a11y-text-secondary font-medium">
                    {item.time}
                  </p>
                  <div className="animate-pulse-soft">
                    {getWeatherIconComponent(item.condition, "md")}
                  </div>
                  <p className="text-a11y-lg font-bold a11y-text">
                    {item.temperature}°
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="animate-slide-up">
          <h3 className="text-a11y-xl font-bold a11y-text mb-4">7天预报</h3>
          <div className="a11y-card divide-y" style={{ borderColor: "var(--color-border)" }}>
            {daily.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                style={{ borderColor: "var(--color-border)" }}
              >
                <div className="w-20">
                  <p className="text-a11y-lg font-bold a11y-text">
                    {item.date}
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-1 justify-center">
                  <div className="flex items-center gap-2">
                    {getWeatherIconComponent(item.dayCondition, "md")}
                    <span className="text-a11y a11y-text-secondary">
                      {item.dayCondition}
                    </span>
                  </div>
                  <span className="a11y-text-secondary">/</span>
                  <div className="flex items-center gap-2">
                    {getWeatherIconComponent(item.nightCondition, "md")}
                    <span className="text-a11y a11y-text-secondary">
                      {item.nightCondition}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-28 justify-end">
                  <span className="text-a11y-lg font-bold text-red-500">
                    {item.highTemp}°
                  </span>
                  <span className="a11y-text-secondary">/</span>
                  <span className="text-a11y-lg font-bold text-blue-500">
                    {item.lowTemp}°
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
