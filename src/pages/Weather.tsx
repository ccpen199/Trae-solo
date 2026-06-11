import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sun,
  Cloud,
  CloudRain,
  Snowflake,
  Wind,
  Droplets,
  ThermometerSun,
  Umbrella,
  Shirt,
  Car,
  Sun as SunIcon,
  Cloud as CloudIcon,
  CloudLightning,
  CloudFog,
} from "lucide-react";

export default function Weather() {
  const navigate = useNavigate();

  const currentWeather = {
    city: "北京市朝阳区",
    temperature: 26,
    condition: "多云",
    feelsLike: 28,
    humidity: 65,
    windSpeed: 12,
    windDirection: "东南风",
    updateTime: "10:30",
  };

  const lifeIndex = [
    {
      title: "紫外线",
      value: "中等",
      description: "涂防晒霜",
      icon: SunIcon,
      color: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      title: "洗车指数",
      value: "较适宜",
      description: "无雨且风力小",
      icon: Car,
      color: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "穿衣建议",
      value: "薄外套",
      description: "早晚温差大",
      icon: Shirt,
      color: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "带伞提醒",
      value: "建议携带",
      description: "下午有小雨",
      icon: Umbrella,
      color: "bg-red-100",
      iconColor: "text-red-600",
      highlight: true,
    },
  ];

  const forecast = [
    { date: "今天", high: 28, low: 18, condition: "多云", icon: Cloud },
    { date: "明天", high: 26, low: 17, condition: "小雨", icon: CloudRain },
    { date: "周三", high: 24, low: 16, condition: "阴", icon: CloudFog },
    { date: "周四", high: 27, low: 18, condition: "晴", icon: Sun },
    { date: "周五", high: 29, low: 20, condition: "晴", icon: Sun },
    { date: "周六", high: 25, low: 17, condition: "雷阵雨", icon: CloudLightning },
    { date: "周日", high: 23, low: 15, condition: "多云", icon: CloudIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            <ArrowLeft size={36} className="text-gray-700" />
          </button>
          <h1 className="flex-1 text-center text-[32px] font-bold text-gray-800">
            天气详情
          </h1>
          <div className="w-14" />
        </div>

        {lifeIndex[3].highlight && (
          <div className="bg-red-500 text-white rounded-2xl p-6 mb-8 flex items-center justify-center gap-4">
            <Umbrella size={48} />
            <div>
              <p className="text-[28px] font-bold">⚠️ 带伞强提醒</p>
              <p className="text-[22px]">今日下午有80%概率降雨，请务必带伞！</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl p-8 shadow-lg mb-8">
          <p className="text-[24px] text-gray-600 text-center mb-2">
            {currentWeather.city}
          </p>
          <div className="flex items-center justify-center gap-6 mb-6">
            <Sun size={80} className="text-orange-500" />
            <div>
              <p className="text-[48px] font-bold text-gray-900 leading-none">
                {currentWeather.temperature}°C
              </p>
              <p className="text-[28px] text-gray-600 mt-2">
                {currentWeather.condition}
              </p>
            </div>
          </div>
          <p className="text-center text-[20px] text-gray-500">
            最近更新：{currentWeather.updateTime}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 text-center">
            <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <ThermometerSun size={40} className="text-orange-600" />
            </div>
            <p className="text-[20px] text-gray-600 mb-1">体感温度</p>
            <p className="text-[32px] font-bold text-gray-900">
              {currentWeather.feelsLike}°
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Droplets size={40} className="text-blue-600" />
            </div>
            <p className="text-[20px] text-gray-600 mb-1">湿度</p>
            <p className="text-[32px] font-bold text-gray-900">
              {currentWeather.humidity}%
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wind size={40} className="text-green-600" />
            </div>
            <p className="text-[20px] text-gray-600 mb-1">风力</p>
            <p className="text-[32px] font-bold text-gray-900">
              {currentWeather.windSpeed}km/h
            </p>
            <p className="text-[18px] text-gray-500">
              {currentWeather.windDirection}
            </p>
          </div>
        </div>

        <h2 className="text-[28px] font-bold text-gray-800 mb-6">生活指数</h2>
        <div className="grid grid-cols-2 gap-6 mb-8">
          {lifeIndex.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className={`bg-white rounded-2xl p-6 ${
                  item.highlight ? "ring-4 ring-red-500" : ""
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`${item.color} w-16 h-16 rounded-2xl flex items-center justify-center`}
                  >
                    <Icon
                      size={40}
                      className={item.highlight ? "text-red-600" : item.iconColor}
                    />
                  </div>
                  <div>
                    <p className="text-[22px] font-bold text-gray-900">
                      {item.title}
                    </p>
                    <p
                      className={`text-[24px] font-bold ${
                        item.highlight ? "text-red-600" : "text-gray-800"
                      }`}
                    >
                      {item.value}
                    </p>
                  </div>
                </div>
                <p className="text-[20px] text-gray-600">{item.description}</p>
              </div>
            );
          })}
        </div>

        <h2 className="text-[28px] font-bold text-gray-800 mb-6">7日预报</h2>
        <div className="bg-white rounded-2xl p-6">
          {forecast.map((day, index) => {
            const Icon = day.icon;
            return (
              <div
                key={index}
                className={`flex items-center justify-between py-4 ${
                  index !== forecast.length - 1 ? "border-b border-gray-200" : ""
                }`}
              >
                <p className="text-[22px] font-bold text-gray-800 w-20">
                  {day.date}
                </p>
                <div className="flex items-center gap-3 flex-1 justify-center">
                  <Icon size={36} className="text-blue-500" />
                  <p className="text-[20px] text-gray-600">{day.condition}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-[24px] font-bold text-red-500">
                    {day.high}°
                  </p>
                  <p className="text-[20px] text-gray-400">/</p>
                  <p className="text-[24px] font-bold text-blue-500">
                    {day.low}°
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
