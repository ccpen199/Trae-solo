import {
  Sun,
  Cloud,
  CloudRain,
  Umbrella,
  Shirt,
  Thermometer,
} from "lucide-react";
import type { WeatherCurrent } from "@/types";
import VoiceButton from "./VoiceButton";

interface WeatherCardProps {
  weather: WeatherCurrent;
}

const getWeatherIcon = (condition: string) => {
  if (condition.includes("雨") || condition.includes("雷")) {
    return <CloudRain className="w-12 h-12 text-blue-500" />;
  }
  if (condition.includes("云") || condition.includes("阴")) {
    return <Cloud className="w-12 h-12 text-gray-500" />;
  }
  return <Sun className="w-12 h-12 text-yellow-500" />;
};

export default function WeatherCard({ weather }: WeatherCardProps) {
  const summaryText = `${weather.city}今日天气，${weather.condition}，温度${weather.temperature}度，体感温度${weather.feelsLike}度。${weather.dressingAdvice}。${weather.umbrellaAdvice.need ? weather.umbrellaAdvice.reason : "无需带伞。"}`;

  return (
    <div className="a11y-card animate-slide-up">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-a11y-xl font-bold a11y-text mb-2">
            {weather.city} 天气
          </h2>
          <p className="a11y-text-secondary text-a11y-sm">
            {weather.condition}
          </p>
        </div>
        {getWeatherIcon(weather.condition)}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Thermometer className="w-8 h-8 text-red-500" />
          <div>
            <p className="a11y-text-secondary text-a11y-sm">当前温度</p>
            <p className="text-a11y-2xl font-bold a11y-text">
              {weather.temperature}°C
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Thermometer className="w-8 h-8 text-orange-500" />
          <div>
            <p className="a11y-text-secondary text-a11y-sm">体感温度</p>
            <p className="text-a11y-2xl font-bold a11y-text">
              {weather.feelsLike}°C
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-6 p-4 rounded-a11y" style={{ backgroundColor: "rgba(255, 122, 69, 0.08)" }}>
        <h3 className="text-a11y-lg font-bold a11y-text flex items-center gap-2">
          今日强提醒
        </h3>

        <div className="flex flex-wrap gap-2">
          <span className="a11y-tag bg-blue-100 text-blue-700">
            <Shirt className="w-5 h-5 mr-1" />
            穿衣：{weather.dressingAdvice}
          </span>

          {weather.umbrellaAdvice.need ? (
            <span className="a11y-tag bg-red-100 text-red-700">
              <Umbrella className="w-5 h-5 mr-1" />
              带伞：{weather.umbrellaAdvice.reason}
            </span>
          ) : (
            <span className="a11y-tag bg-green-100 text-green-700">
              <Umbrella className="w-5 h-5 mr-1" />
              无需带伞
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <VoiceButton text={summaryText} label="播报天气" />
      </div>
    </div>
  );
}
